import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { NextRequest } from 'next/server'
import { handleGrafanaProxy } from '../src/index'
import type { GrafanaProxyConfig } from '../src/types'

type HeadersWithOptionalGetSetCookie = Headers & {
  getSetCookie?: () => string[]
}

type RecordedRequest = {
  method: string
  url: string
  headers: IncomingMessage['headers']
  body: string
}

const recordedRequests: RecordedRequest[] = []
const redirectTargetRequests: RecordedRequest[] = []

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

async function startSlowGrafana(sendHeaders = false) {
  let resolveRequest!: () => void
  let resolveClose!: () => void
  const requestReceived = new Promise<void>((resolve) => { resolveRequest = resolve })
  const upstreamClosed = new Promise<void>((resolve) => { resolveClose = resolve })
  const server = createServer((_req, res) => {
    const fallback = setTimeout(() => res.end('fixture deadline'), 2000)
    res.once('close', () => clearTimeout(fallback))
    res.once('close', resolveClose)
    if (sendHeaders) {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.write('partial response')
    }
    resolveRequest()
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address() as AddressInfo

  return {
    grafanaUrl: `http://127.0.0.1:${address.port}`,
    requestReceived,
    upstreamClosed,
    close: async () => {
      server.closeAllConnections()
      await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve())
      })
    },
  }
}

describe('handleGrafanaProxy integration', () => {
  let server: ReturnType<typeof createServer>
  let redirectTargetServer: ReturnType<typeof createServer>
  let grafanaUrl = ''
  let redirectTargetUrl = ''

  beforeAll(async () => {
    redirectTargetServer = createServer(async (req, res) => {
      const body = await readBody(req)
      redirectTargetRequests.push({
        method: req.method ?? 'GET',
        url: req.url ?? '/',
        headers: req.headers,
        body,
      })
      sendJson(res, 200, { ok: true })
    })

    await new Promise<void>((resolve) => {
      redirectTargetServer.listen(0, '127.0.0.1', () => resolve())
    })

    const redirectTargetAddress = redirectTargetServer.address() as AddressInfo
    redirectTargetUrl = `http://127.0.0.1:${redirectTargetAddress.port}`

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

      if (req.url === '/api/grafana/redirect-cross-origin') {
        res.writeHead(302, { Location: `${redirectTargetUrl}/capture` })
        res.end()
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

    await new Promise<void>((resolve, reject) => {
      redirectTargetServer.close((error) => {
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
    redirectTargetRequests.length = 0
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

    const responseHeaders = response.headers as HeadersWithOptionalGetSetCookie
    if (typeof responseHeaders.getSetCookie === 'function') {
      const cookies = responseHeaders.getSetCookie()
      expect(cookies).toHaveLength(2)
      expect(cookies).toEqual(
        expect.arrayContaining([
          expect.stringContaining('grafana_session=abc123'),
          expect.stringContaining('grafana_csrf=token123'),
        ])
      )
    } else {
      const setCookie = response.headers.get('Set-Cookie')
      expect(setCookie).toContain('grafana_session=abc123')
      expect(setCookie).toContain('grafana_csrf=token123')
    }
  })

  it.each(['用户@example.com', 'user\x07@example.com', 'user\x7f@example.com'])(
    'rejects invalid identity %j before reaching Grafana',
    async (userEmail) => {
      const request = new NextRequest('http://localhost:3000/api/grafana/api/health')
      const response = await handleGrafanaProxy(
        request,
        { grafanaUrl, userEmail, userRole: 'Viewer' },
        ['api', 'health']
      )

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Invalid user email' })
      expect(recordedRequests).toHaveLength(0)
    }
  )

  it('returns 499 without contacting Grafana for an already-aborted client', async () => {
    const controller = new AbortController()
    controller.abort(new Error('Client disconnected'))
    const request = new NextRequest('http://localhost:3000/api/grafana/api/health', {
      signal: controller.signal,
    })
    const response = await handleGrafanaProxy(
      request,
      { grafanaUrl, userEmail: 'integration@example.com', userRole: 'Viewer' },
      ['api', 'health']
    )

    expect(response.status).toBe(499)
    expect(await response.json()).toEqual({ error: 'Client request cancelled' })
    expect(recordedRequests).toHaveLength(0)
  })

  it.each([false, true].flatMap((sendHeaders) =>
    [undefined, new Error('Client disconnected'), 'Superseded query', null, Number.NaN]
      .map((reason) => ({ sendHeaders, reason }))
  ))('cancels the actual upstream connection (headers sent: $sendHeaders, reason: $reason)', async ({ sendHeaders, reason }) => {
    const upstream = await startSlowGrafana(sendHeaders)
    let resolveBodyRead!: () => void
    const bodyReadStarted = new Promise<void>((resolve) => { resolveBodyRead = resolve })
    const nativeFetch = globalThis.fetch
    // Observe, but do not replace, the real network/body read. This ensures the
    // headers-sent cases abort only after the proxy starts buffering the body.
    const fetchSpy = sendHeaders ? vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (...args) => {
      const response = await nativeFetch(...args)
      const readBody = response.arrayBuffer.bind(response)
      response.arrayBuffer = () => {
        resolveBodyRead()
        return readBody()
      }
      return response
    }) : undefined
    try {
      const controller = new AbortController()
      const request = new NextRequest('http://localhost:3000/api/grafana/api/slow', {
        signal: controller.signal,
      })
      const responsePromise = handleGrafanaProxy(
        request,
        {
          grafanaUrl: upstream.grafanaUrl,
          userEmail: 'integration@example.com',
          userRole: 'Viewer',
          requestTimeoutMs: 300,
        },
        ['api', 'slow']
      )

      await (sendHeaders ? bodyReadStarted : upstream.requestReceived)
      controller.abort(reason)
      const response = await responsePromise
      expect(response.status).toBe(499)
      expect(await response.json()).toEqual({ error: 'Client request cancelled' })
      await upstream.upstreamClosed
    } finally {
      fetchSpy?.mockRestore()
      await upstream.close()
    }
  })

  it('still returns 504 and closes Grafana when the header deadline expires', async () => {
    const upstream = await startSlowGrafana()
    try {
      const request = new NextRequest('http://localhost:3000/api/grafana/api/slow')
      const response = await handleGrafanaProxy(
        request,
        {
          grafanaUrl: upstream.grafanaUrl,
          userEmail: 'integration@example.com',
          userRole: 'Viewer',
          requestTimeoutMs: 100,
        },
        ['api', 'slow']
      )

      expect(response.status).toBe(504)
      expect(await response.json()).toEqual({ error: 'Grafana request timed out' })
      await upstream.upstreamClosed
    } finally {
      await upstream.close()
    }
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

  it('does not follow cross-origin redirects with trusted auth headers', async () => {
    const config: GrafanaProxyConfig = {
      grafanaUrl,
      userEmail: 'integration@example.com',
      userRole: 'Viewer',
    }

    const request = new NextRequest(
      'http://localhost:3000/api/grafana/redirect-cross-origin'
    )
    const response = await handleGrafanaProxy(request, config, ['redirect-cross-origin'])

    expect(redirectTargetRequests[0]?.headers['x-webauth-user']).toBeUndefined()
    expect(redirectTargetRequests).toHaveLength(0)
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe(`${redirectTargetUrl}/capture`)
  })
})
