import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { NextRequest } from 'next/server'
import { handleGrafanaProxy } from '../src/index'
import type { GrafanaProxyConfig } from '../src/types'

type RecordedRequest = {
  method: string
  url: string
  headers: IncomingMessage['headers']
  body: string
}

const recordedRequests: RecordedRequest[] = []

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown, cookies?: string[]) {
  if (cookies) {
    res.setHeader('Set-Cookie', cookies)
  }
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

describe('handleGrafanaProxy integration', () => {
  let server: ReturnType<typeof createServer>
  let grafanaUrl = ''

  beforeAll(async () => {
    server = createServer(async (req, res) => {
      const body = await readBody(req)
      recordedRequests.push({
        method: req.method ?? 'GET',
        url: req.url ?? '/',
        headers: req.headers,
        body,
      })

      if (req.url?.startsWith('/api/grafana/api/health')) {
        sendJson(
          res,
          200,
          { ok: true },
          ['grafana_session=abc123; Path=/; HttpOnly', 'grafana_csrf=token123; Path=/; Secure']
        )
        return
      }

      if (req.url === '/api/grafana/api/echo' && req.method === 'POST') {
        sendJson(res, 200, { echoed: body })
        return
      }

      sendJson(res, 404, { error: 'Not found' })
    })

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve())
    })

    const address = server.address() as AddressInfo
    grafanaUrl = `http://127.0.0.1:${address.port}`
  })

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }
        resolve()
      })
    })
  })

  beforeEach(() => {
    recordedRequests.length = 0
  })

  it('proxies GET requests end-to-end with auth headers and cookies', async () => {
    const config: GrafanaProxyConfig = {
      grafanaUrl,
      userEmail: 'integration@example.com',
      userRole: 'Viewer',
    }

    const request = new NextRequest('http://localhost:3000/api/grafana/api/health?probe=true')

    const response = await handleGrafanaProxy(request, config, ['api', 'health'])

    expect(response.status).toBe(200)
    expect(recordedRequests).toHaveLength(1)
    expect(recordedRequests[0].url).toBe('/api/grafana/api/health?probe=true')
    expect(recordedRequests[0].headers['x-webauth-user']).toBe('integration@example.com')
    expect(recordedRequests[0].headers['x-webauth-role']).toBe('Viewer')

    const setCookie = response.headers.get('Set-Cookie')
    expect(setCookie).toContain('grafana_session=abc123')
  })

  it('proxies POST body end-to-end', async () => {
    const config: GrafanaProxyConfig = {
      grafanaUrl,
      userEmail: 'integration@example.com',
      userRole: 'Editor',
    }

    const payload = JSON.stringify({ hello: 'world' })
    const request = new NextRequest('http://localhost:3000/api/grafana/api/echo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
    })

    const response = await handleGrafanaProxy(request, config, ['api', 'echo'])

    expect(response.status).toBe(200)
    expect(recordedRequests).toHaveLength(1)
    expect(recordedRequests[0].method).toBe('POST')
    expect(recordedRequests[0].headers['content-type']).toContain('application/json')
    expect(recordedRequests[0].body).toBe(payload)

    const json = await response.json()
    expect(json.echoed).toBe(payload)
  })
})
