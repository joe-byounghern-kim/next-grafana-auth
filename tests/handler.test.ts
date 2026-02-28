import { beforeEach, describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { handleGrafanaProxy } from '../src/index'
import type { GrafanaProxyConfig } from '../src/types'

// Mock global fetch
global.fetch = vi.fn()

describe('handleGrafanaProxy', () => {
  const mockConfig: GrafanaProxyConfig = {
    grafanaUrl: 'http://grafana:3000',
    userEmail: 'test@example.com',
    userRole: 'Viewer',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should validate Grafana URL and return error if invalid', async () => {
    const invalidConfig: GrafanaProxyConfig = {
      ...mockConfig,
      grafanaUrl: 'invalid-url',
    }

    const request = new NextRequest('http://localhost:3000/api/grafana/d/test')
    const response = await handleGrafanaProxy(request, invalidConfig)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Invalid Grafana URL configuration')
  })

  it('should return 400 for invalid user email', async () => {
    const invalidConfig: GrafanaProxyConfig = {
      ...mockConfig,
      userEmail: 'invalid-email',
    }

    const request = new NextRequest('http://localhost:3000/api/grafana/d/test')
    const response = await handleGrafanaProxy(request, invalidConfig)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Invalid user email')
  })

  it('should return 400 for email containing newline (header injection attempt)', async () => {
    const invalidConfig: GrafanaProxyConfig = {
      ...mockConfig,
      userEmail: 'attacker@evil.com\r\nX-Injected: true',
    }

    const request = new NextRequest('http://localhost:3000/api/grafana/d/test')
    const response = await handleGrafanaProxy(request, invalidConfig)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Invalid user email')
  })

  it('should return 400 for email containing whitespace', async () => {
    const invalidConfig: GrafanaProxyConfig = {
      ...mockConfig,
      userEmail: 'user @example.com',
    }

    const request = new NextRequest('http://localhost:3000/api/grafana/d/test')
    const response = await handleGrafanaProxy(request, invalidConfig)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Invalid user email')
  })

  it('should return 400 for invalid user role', async () => {
    const invalidConfig: GrafanaProxyConfig = {
      ...mockConfig,
      userRole: 'Owner' as unknown as GrafanaProxyConfig['userRole'],
    }

    const request = new NextRequest('http://localhost:3000/api/grafana/d/test')
    const response = await handleGrafanaProxy(request, invalidConfig)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Invalid user role')
  })

  it('should proxy GET requests to Grafana with correct headers', async () => {
    const mockResponse = new Response('test data', {
      headers: { 'Content-Type': 'application/json' },
    })

    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/grafana/d/test')
    await handleGrafanaProxy(request, mockConfig, ['d', 'test'])

    expect(global.fetch).toHaveBeenCalledWith(
      'http://grafana:3000/api/grafana/d/test',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'X-WEBAUTH-USER': 'test@example.com',
          'X-WEBAUTH-ROLE': 'Viewer',
        }),
      })
    )
  })

  it('should ignore incoming identity headers and use trusted config headers', async () => {
    const mockResponse = new Response('ok', {
      headers: { 'Content-Type': 'application/json' },
    })

    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/grafana/d/test', {
      headers: {
        'X-WEBAUTH-USER': 'attacker@example.com',
        'X-WEBAUTH-ROLE': 'Admin',
        Authorization: 'Bearer attacker-token',
      },
    })

    await handleGrafanaProxy(request, mockConfig, ['d', 'test'])

    expect(global.fetch).toHaveBeenCalledWith(
      'http://grafana:3000/api/grafana/d/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-WEBAUTH-USER': 'test@example.com',
          'X-WEBAUTH-ROLE': 'Viewer',
        }),
      })
    )

    const [, options] = vi.mocked(global.fetch).mock.calls[0]
    const forwardedHeaders = options?.headers as Record<string, string>

    expect(forwardedHeaders.authorization).toBeUndefined()
  })

  it('should proxy POST requests with body', async () => {
    const mockResponse = new Response('success', {
      headers: { 'Content-Type': 'application/json' },
    })

    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

    const body = JSON.stringify({ test: 'data' })
    const request = new NextRequest('http://localhost:3000/api/grafana/api/datasources', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
    })

    await handleGrafanaProxy(request, mockConfig, ['api', 'datasources'])

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        // The Headers API normalizes names to lowercase, so the loop in the proxy
        // sets 'content-type' (lowercase), not 'Content-Type'.
        headers: expect.objectContaining({
          'content-type': 'application/json',
        }),
        body: expect.any(ArrayBuffer),
      })
    )
  })

  it('should proxy DELETE requests with body', async () => {
    const mockResponse = new Response('deleted', {
      headers: { 'Content-Type': 'application/json' },
    })

    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

    const body = JSON.stringify({ id: 'dashboard-1' })
    const request = new NextRequest('http://localhost:3000/api/grafana/api/dashboards/uid/test', {
      method: 'DELETE',
      body,
      headers: { 'Content-Type': 'application/json' },
    })

    await handleGrafanaProxy(request, mockConfig, ['api', 'dashboards', 'uid', 'test'])

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'DELETE',
        body: expect.any(ArrayBuffer),
      })
    )
  })

  it('should handle empty path parameters', async () => {
    const mockResponse = new Response('test', {
      headers: { 'Content-Type': 'application/json' },
    })

    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/grafana')
    await handleGrafanaProxy(request, mockConfig)

    expect(global.fetch).toHaveBeenCalledWith(
      'http://grafana:3000/api/grafana',
      expect.any(Object)
    )
  })

  it('should reject path traversal segments in path params', async () => {
    const request = new NextRequest('http://localhost:3000/api/grafana/../../etc/passwd')
    const response = await handleGrafanaProxy(request, mockConfig, ['..', '..', 'etc', 'passwd'])

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Invalid Grafana path')
  })

  it('should forward Set-Cookie headers from Grafana response', async () => {
    const mockResponse = new Response('test', {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'grafana_session=abc123; Path=/; HttpOnly',
      },
    })

    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/grafana/d/test')
    const response = await handleGrafanaProxy(request, mockConfig, ['d', 'test'])

    expect(response.headers.get('Set-Cookie')).toBe('grafana_session=abc123; Path=/; HttpOnly')
  })

  it('should forward Set-Cookie via fallback when getSetCookie is unavailable', async () => {
    const body = new TextEncoder().encode('test')
    const responseLike = {
      status: 200,
      headers: {
        entries(): IterableIterator<[string, string]> {
          return new Map<string, string>([
            ['content-type', 'application/json'],
            ['set-cookie', 'grafana_session=fallback123; Path=/; HttpOnly'],
          ]).entries()
        },
        get(name: string): string | null {
          if (name.toLowerCase() === 'set-cookie') {
            return 'grafana_session=fallback123; Path=/; HttpOnly'
          }
          if (name.toLowerCase() === 'content-type') {
            return 'application/json'
          }
          return null
        },
      },
      arrayBuffer: async () => body.buffer,
    } as unknown as Response

    vi.mocked(global.fetch).mockResolvedValueOnce(responseLike)

    const request = new NextRequest('http://localhost:3000/api/grafana/d/test')
    const response = await handleGrafanaProxy(request, mockConfig, ['d', 'test'])

    expect(response.status).toBe(200)
    expect(response.headers.get('Set-Cookie')).toBe('grafana_session=fallback123; Path=/; HttpOnly')
  })

  it('should forward safe request headers and block forbidden headers', async () => {
    const mockResponse = new Response('ok', {
      headers: { 'Content-Type': 'application/json' },
    })

    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/grafana/d/test', {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en-US',
        'Cache-Control': 'no-cache',
        Cookie: 'grafana_session=abc123',
        Authorization: 'Bearer attacker-token',
        'X-WEBAUTH-USER': 'attacker@example.com',
      },
    })

    await handleGrafanaProxy(request, mockConfig, ['d', 'test'])

    const [, options] = vi.mocked(global.fetch).mock.calls[0]
    const forwardedHeaders = options?.headers as Record<string, string>

    expect(forwardedHeaders.accept).toBe('application/json')
    expect(forwardedHeaders['accept-language']).toBe('en-US')
    expect(forwardedHeaders['cache-control']).toBe('no-cache')
    expect(forwardedHeaders.cookie).toBeUndefined()
    expect(forwardedHeaders.authorization).toBeUndefined()
    expect(forwardedHeaders['X-WEBAUTH-USER']).toBe('test@example.com')
  })

  it('should forward configured custom request headers', async () => {
    const mockResponse = new Response('ok', {
      headers: { 'Content-Type': 'application/json' },
    })

    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/grafana/d/test', {
      headers: {
        'X-Request-ID': 'req-123',
      },
    })

    await handleGrafanaProxy(
      request,
      {
        ...mockConfig,
        forwardRequestHeaders: ['x-request-id'],
      },
      ['d', 'test']
    )

    const [, options] = vi.mocked(global.fetch).mock.calls[0]
    const forwardedHeaders = options?.headers as Record<string, string>
    expect(forwardedHeaders['x-request-id']).toBe('req-123')
  })

  it('should forward safe response metadata headers', async () => {
    const mockResponse = new Response('test', {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        ETag: 'W/"123"',
      },
    })

    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

    const request = new NextRequest('http://localhost:3000/api/grafana/d/test')
    const response = await handleGrafanaProxy(request, mockConfig, ['d', 'test'])

    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.get('ETag')).toBe('W/"123"')
  })

  it('should return 504 when upstream request times out', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new DOMException('Request aborted', 'AbortError'))

    const request = new NextRequest('http://localhost:3000/api/grafana/d/test')
    const response = await handleGrafanaProxy(request, mockConfig, ['d', 'test'])

    expect(response.status).toBe(504)
    const data = await response.json()
    expect(data.error).toBe('Grafana request timed out')
  })

  it('should handle fetch errors gracefully', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'))

    const request = new NextRequest('http://localhost:3000/api/grafana/d/test')
    const response = await handleGrafanaProxy(request, mockConfig, ['d', 'test'])

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to proxy request')
  })

  it('should reject invalid request timeout values', async () => {
    const request = new NextRequest('http://localhost:3000/api/grafana/d/test')
    const response = await handleGrafanaProxy(
      request,
      {
        ...mockConfig,
        requestTimeoutMs: 0,
      },
      ['d', 'test']
    )

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Invalid request timeout')
  })

  it('should strip trailing slash from Grafana URL', async () => {
    const mockResponse = new Response('test', {
      headers: { 'Content-Type': 'application/json' },
    })

    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse)

    const configWithTrailingSlash: GrafanaProxyConfig = {
      ...mockConfig,
      grafanaUrl: 'http://grafana:3000/',
    }

    const request = new NextRequest('http://localhost:3000/api/grafana/d/test')
    await handleGrafanaProxy(request, configWithTrailingSlash, ['d', 'test'])

    expect(global.fetch).toHaveBeenCalledWith(
      'http://grafana:3000/api/grafana/d/test',
      expect.any(Object)
    )
  })
})
