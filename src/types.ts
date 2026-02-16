/**
 * Configuration for the Grafana proxy handler
 */
export interface GrafanaProxyConfig {
  /** Grafana server internal URL (e.g., 'http://grafana:3000' for Docker or 'http://localhost:3001' for local) */
  grafanaUrl: string
  /** User's email address for authentication */
  userEmail: string
  /** User's Grafana role */
  userRole: 'Admin' | 'Editor' | 'Viewer'
  /** Path prefix for the proxy route (default: '/api/grafana') */
  pathPrefix?: string
  /** Request timeout in milliseconds for upstream Grafana calls (default: 10000) */
  requestTimeoutMs?: number
  /** Additional safe request headers to forward to Grafana (case-insensitive) */
  forwardRequestHeaders?: string[]
}

/**
 * URL parameters for customizing embedded Grafana dashboards
 */
export interface GrafanaUrlParams {
  /** Enable kiosk mode (hides navigation/sidebar) */
  kiosk?: boolean | 'tv'
  /** Dashboard theme: 'light' or 'dark' */
  theme?: 'light' | 'dark'
  /** Auto-refresh interval (e.g., '5s', '30s', '1m', '5m') */
  refresh?: string
  /** Time range start (e.g., 'now-1h', 'now-24h') */
  from?: string
  /** Time range end (e.g., 'now') */
  to?: string
  /** Organization ID */
  orgId?: number
  /** JWT Authentication Token */
  authToken?: string
  /** Template variables (key-value pairs) */
  variables?: Record<string, string | string[]>
}

export interface GrafanaRetryContext {
  attempt: number
  reason: 'timeout' | 'error'
}

/**
 * Props for the GrafanaDashboard component
 */
export interface GrafanaDashboardProps {
  /** Grafana proxy base URL (usually '/api/grafana') */
  baseUrl: string
  /** Dashboard UID */
  dashboardUid: string
  /** Dashboard slug (optional, for cleaner URLs) */
  dashboardSlug?: string
  /** URL parameters for customizing the dashboard */
  params?: GrafanaUrlParams
  /** Show loading overlay while iframe loads */
  showLoading?: boolean
  /** Minimum time to show loading spinner (ms) */
  minLoadingTime?: number
  /** Additional buffer time after onLoad to allow Grafana to render (ms) */
  renderBuffer?: number
  /** Fallback timeout when iframe never loads (ms) */
  fallbackTimeoutMs?: number
  /** Accessible loading status message */
  loadingMessage?: string
  /** Message shown when load fallback timeout is reached */
  timeoutMessage?: string
  /** Message shown when iframe load fails */
  errorMessage?: string
  /** Accessible iframe title */
  title?: string
  /** Show retry button on timeout/error overlay */
  showRetryButton?: boolean
  /** Retry button text */
  retryButtonText?: string
  /** Callback fired when retry is triggered */
  onRetry?: (context: GrafanaRetryContext) => void
  /** CSS className */
  className?: string
  /** Inline styles */
  style?: React.CSSProperties
}

/**
 * Internal proxy handler function signature
 * @internal
 */
export type ProxyHandlerFunction = (
  request: Request,
  config: GrafanaProxyConfig,
  pathParams?: string[]
) => Promise<Response>
