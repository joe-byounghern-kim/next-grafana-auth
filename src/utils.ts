import type { GrafanaUrlParams } from './types'

/**
 * Safely extracts and sanitizes the Grafana path from catch-all route segments.
 *
 * @param pathParams - The path array from dynamic route params
 * @returns The path string joined with '/'
 */
export function extractGrafanaPath(pathParams: string[]): string {
  if (!pathParams || pathParams.length === 0) {
    return ''
  }

  const sanitizedSegments = pathParams
    .filter((segment) => segment.length > 0)
    .map((segment) => {
      if (segment === '.' || segment === '..') {
        throw new Error('Invalid path segment')
      }
      return encodeURIComponent(segment)
    })

  return sanitizedSegments.join('/')
}

/**
 * Strips trailing slashes from a URL
 *
 * @param url - URL to clean
 * @returns URL without trailing slash
 */
export function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '')
}

/**
 * Strips leading slashes from a path
 *
 * @param path - Path to clean
 * @returns Path without leading slash
 */
export function stripLeadingSlash(path: string): string {
  return path.replace(/^\/+/, '')
}

/**
 * Joins URL parts safely, handling edge cases with slashes
 *
 * @param parts - URL parts to join
 * @returns Joined URL string
 */
export function joinPaths(...parts: string[]): string {
  return parts
    .map((part) => stripTrailingSlash(stripLeadingSlash(part)))
    .filter(Boolean)
    .join('/')
}

/**
 * Builds URL search params from GrafanaUrlParams
 *
 * @param params - Grafana URL parameters
 * @returns URLSearchParams object
 */
export function buildGrafanaParams(params: GrafanaUrlParams): URLSearchParams {
  const searchParams = new URLSearchParams()

  if (params.kiosk) {
    searchParams.set('kiosk', params.kiosk === 'tv' ? 'tv' : '1')
  }
  if (params.authToken) {
    searchParams.set('auth_token', params.authToken)
  }
  if (params.theme) {
    searchParams.set('theme', params.theme)
  }
  if (params.refresh) {
    searchParams.set('refresh', params.refresh)
  }
  if (params.from) {
    searchParams.set('from', params.from)
  }
  if (params.to) {
    searchParams.set('to', params.to)
  }
  if (params.orgId) {
    searchParams.set('orgId', String(params.orgId))
  }
  if (params.variables) {
    Object.entries(params.variables).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => {
          searchParams.append(`var-${key}`, v)
        })
      } else {
        searchParams.set(`var-${key}`, value)
      }
    })
  }

  return searchParams
}

/**
 * Validates that a URL is properly formatted
 *
 * @param url - URL to validate
 * @returns true if valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
