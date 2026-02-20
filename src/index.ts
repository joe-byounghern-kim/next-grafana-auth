import type { GrafanaProxyConfig, ProxyHandlerFunction } from './types'
import { extractGrafanaPath, isValidUrl, stripTrailingSlash } from './utils'

/**
 * Default path prefix for the proxy
 */
const DEFAULT_PATH_PREFIX = '/api/grafana'
const DEFAULT_REQUEST_TIMEOUT_MS = 10000
const VALID_GRAFANA_ROLES = new Set(['Admin', 'Editor', 'Viewer'])
const SAFE_REQUEST_HEADERS = new Set([
  'accept',
  'accept-language',
  'cache-control',
  'content-type',
  'if-modified-since',
  'if-none-match',
])
const FORBIDDEN_FORWARD_HEADERS = new Set(['authorization', 'cookie'])
const SAFE_RESPONSE_HEADERS = new Set([
  'cache-control',
  'content-disposition',
  'content-type',
  'etag',
  'expires',
  'last-modified',
])

/**
 * Handles proxying requests to Grafana with auth-proxy headers
 *
 * This function forwards the incoming HTTP method to Grafana and forwards
 * request bodies for POST, PUT, PATCH, and DELETE with trusted auth headers.
 *
 * @param request - Web Request object (NextRequest-compatible)
 * @param config - Proxy configuration including Grafana URL and user info
 * @param pathParams - The dynamic path array from [...path] catch-all route
 * @returns Next.js Response with Grafana's response
 *
 * @example
 * ```typescript
 * import { handleGrafanaProxy } from 'next-grafana-auth'
 * import { cookies } from 'next/headers'
 *
 * export async function GET(
 *   request: NextRequest,
 *   { params }: { params: Promise<{ path: string[] }> }
 * ) {
 *   const cookieStore = await cookies()
 *   const sessionId = cookieStore.get('session')?.value
 *
 *   // Fetch user from your auth system
 *   const user = await getUser(sessionId)
 *
 *   const grafanaUrl = process.env.GRAFANA_INTERNAL_URL
 *   if (!grafanaUrl) {
 *     return Response.json({ error: 'Missing GRAFANA_INTERNAL_URL' }, { status: 500 })
 *   }
 *
 *   return handleGrafanaProxy(request, {
 *     grafanaUrl,
 *     userEmail: user.email,
 *     userRole: user.role,
 *   }, (await params).path)
 * }
 * ```
 */
export const handleGrafanaProxy: ProxyHandlerFunction = async (
  request: Request,
  config: GrafanaProxyConfig,
  pathParams?: string[]
): Promise<Response> => {
  const {
    grafanaUrl,
    userEmail,
    userRole,
    pathPrefix = DEFAULT_PATH_PREFIX,
    requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    forwardRequestHeaders = [],
  } = config

  // Validate Grafana URL
  if (!grafanaUrl || !isValidUrl(grafanaUrl)) {
    return Response.json(
      { error: 'Invalid Grafana URL configuration' },
      { status: 500 }
    )
  }

  // Reject emails that contain whitespace or control characters to prevent
  // header injection via the X-WEBAUTH-USER auth-proxy header
  if (!userEmail || !userEmail.includes('@') || /[\s\r\n\0]/.test(userEmail)) {
    return Response.json({ error: 'Invalid user email' }, { status: 400 })
  }

  if (!VALID_GRAFANA_ROLES.has(userRole)) {
    return Response.json({ error: 'Invalid user role' }, { status: 400 })
  }

  if (!pathPrefix.startsWith('/') || pathPrefix.includes('..')) {
    return Response.json({ error: 'Invalid path prefix' }, { status: 500 })
  }

  if (!Number.isFinite(requestTimeoutMs) || requestTimeoutMs <= 0) {
    return Response.json({ error: 'Invalid request timeout' }, { status: 500 })
  }

  try {
    // Clean and build target URL
    const cleanGrafanaUrl = stripTrailingSlash(grafanaUrl)
    const pathStr = pathParams ? extractGrafanaPath(pathParams) : ''
    const cleanPath = pathStr.startsWith('/') ? pathStr.slice(1) : pathStr
    const requestUrl = new URL(request.url)
    const searchParams = requestUrl.searchParams.toString()

    // Include the path prefix (e.g., /api/grafana) since serve_from_sub_path=true
    const cleanPathPrefix = pathPrefix.startsWith('/') ? pathPrefix.slice(1) : pathPrefix
    const targetUrl = `${cleanGrafanaUrl}/${cleanPathPrefix}${cleanPath ? `/${cleanPath}` : ''}${searchParams ? `?${searchParams}` : ''}`

    // Build headers for Grafana auth-proxy
    const headers: Record<string, string> = {
      'X-WEBAUTH-USER': userEmail,
      'X-WEBAUTH-ROLE': userRole,
    }

    // Strip forbidden headers from consumer-configured forwardRequestHeaders before they
    // reach the allowlist — this is a defence-in-depth pre-filter so that the loop
    // below never even considers them (the loop has its own identical guard as a second
    // layer to catch any future code paths that bypass this set).
    const extraForwardHeaders = new Set(
      forwardRequestHeaders
        .map((header) => header.trim().toLowerCase())
        .filter(
          (header) =>
            header.length > 0 &&
            !header.startsWith('x-webauth-') &&
            !FORBIDDEN_FORWARD_HEADERS.has(header)
        )
    )

    // Second defence layer: regardless of the extraForwardHeaders set, always skip
    // identity headers and forbidden headers from the incoming request.
    for (const [name, value] of request.headers.entries()) {
      const lowerName = name.toLowerCase()
      if (lowerName.startsWith('x-webauth-') || FORBIDDEN_FORWARD_HEADERS.has(lowerName)) {
        continue
      }

      if (SAFE_REQUEST_HEADERS.has(lowerName) || extraForwardHeaders.has(lowerName)) {
        headers[name] = value
      }
    }

    // Read request body for POST/PUT/PATCH/DELETE methods
    let body: BodyInit | undefined
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      body = await request.arrayBuffer()
    }

    // Proxy request to Grafana
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs)

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      // Follow redirects for Grafana login
      redirect: 'follow',
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timeoutId)
    })

    // Return response with appropriate content type and forward cookies
    const data = await response.arrayBuffer()

    // Create response and forward Set-Cookie headers from Grafana to the browser
    // This is critical for session management when both anonymous and proxy auth are enabled
    const nextResponse = new Response(data, { status: response.status })

    for (const [name, value] of response.headers.entries()) {
      if (SAFE_RESPONSE_HEADERS.has(name.toLowerCase())) {
        nextResponse.headers.set(name, value)
      }
    }

    if (!nextResponse.headers.get('Content-Type')) {
      nextResponse.headers.set('Content-Type', 'application/octet-stream')
    }

    // Forward all Set-Cookie headers from Grafana
    // Next.js requires using headers.append() to set multiple Set-Cookie headers
    const setCookieHeaders = response.headers.getSetCookie()
    for (const cookie of setCookieHeaders) {
      nextResponse.headers.append('Set-Cookie', cookie)
    }

    return nextResponse
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid path segment') {
      return Response.json({ error: 'Invalid Grafana path' }, { status: 400 })
    }

    const isAbortError =
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name: string }).name === 'AbortError'

    if (isAbortError) {
      return Response.json({ error: 'Grafana request timed out' }, { status: 504 })
    }

    return Response.json({ error: 'Failed to proxy request' }, { status: 500 })
  }
}

// Export types
export type { GrafanaDashboardProps, GrafanaProxyConfig, GrafanaRetryContext, GrafanaUrlParams } from './types'
export { buildGrafanaParams, extractGrafanaPath, isValidUrl, joinPaths, stripTrailingSlash } from './utils'
