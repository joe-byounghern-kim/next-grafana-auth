'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { GrafanaDashboardProps } from './types'
import { buildGrafanaParams, stripTrailingSlash } from './utils'

/**
 * Default minimum time to show the loading spinner (ms).
 * This ensures the spinner doesn't flash briefly and gives Grafana
 * time to render after the iframe's onLoad event fires.
 */
const DEFAULT_MIN_LOADING_TIME = 1500

/**
 * Default additional buffer time after onLoad to allow Grafana to render (ms).
 * The iframe onLoad fires when the HTML loads, but Grafana still needs
 * time to fetch data and render charts.
 */
const DEFAULT_RENDER_BUFFER = 500
const DEFAULT_FALLBACK_TIMEOUT = 10000
const DEFAULT_READINESS_CHECK_INTERVAL = 250
const DEFAULT_LOADING_MESSAGE = 'Loading dashboard...'
const DEFAULT_TIMEOUT_MESSAGE = 'Dashboard is taking longer than expected to load.'
const DEFAULT_ERROR_MESSAGE = 'Failed to load dashboard. Please try again.'
const DEFAULT_TITLE = 'Grafana Dashboard'
const DEFAULT_RETRY_BUTTON_TEXT = 'Retry'
const DEFAULT_IFRAME_SANDBOX = 'allow-scripts allow-same-origin allow-forms'

const containerStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
}

const iframeStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  border: 'none',
  display: 'block',
}

const loadingOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10,
}

const retryButtonStyle: React.CSSProperties = {
  border: '1px solid #1f2937',
  borderRadius: '0.375rem',
  background: '#1f2937',
  color: '#ffffff',
  padding: '0.5rem 0.875rem',
  fontSize: '0.875rem',
  lineHeight: '1.25rem',
  cursor: 'pointer',
}

const spinnerStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  border: '3px solid #f3f3f3',
  borderTop: '3px solid #3b82f6',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
}

// Stable DOM ID used to deduplicate the keyframe <style> tag across multiple
// GrafanaDashboard instances on the same page.
const SPINNER_STYLE_ID = 'next-grafana-auth-spinner-styles'

// CSS for spinner animation
const spinnerKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

function inspectNavigation(
  iframe: HTMLIFrameElement,
  fromLoadEvent: boolean,
): 'pending' | 'ready' | 'error' | 'inaccessible' {
  try {
    const iframeWindow = iframe.contentWindow
    const iframeDocument = iframe.contentDocument
    if (!iframeWindow) return 'pending'
    if (!iframeDocument) return 'inaccessible'

    // Inspect the completed navigation, not src, which still names the requested
    // dashboard after a redirect. The initial about:blank is not a response.
    const location = iframeWindow.location
    if (location.href.startsWith('about:blank') || iframeDocument.readyState !== 'complete') {
      return 'pending'
    }

    const contentType = iframeDocument.contentType.toLowerCase().split(';')[0].trim()
    const isJson = contentType === 'application/json' || contentType === 'text/json' || contentType.endsWith('+json')
    if (isJson || !location.pathname.includes('/d/')) return 'error'

    return fromLoadEvent || (iframeDocument.body?.childElementCount ?? 0) > 0 ? 'ready' : 'pending'
  } catch {
    // Cross-origin and sandbox restrictions cannot establish an error response.
    // Keep the existing onLoad fallback for documents we cannot inspect.
    return 'inaccessible'
  }
}

/**
 * Embeds a full Grafana dashboard using iframe with auth-proxy authentication
 *
 * @example
 * ```tsx
 * <GrafanaDashboard
 *   baseUrl="/api/grafana"
 *   dashboardUid="abc123"
 *   dashboardSlug="my-dashboard"
 *   params={{ kiosk: true, theme: 'dark', from: 'now-1h', to: 'now' }}
 *   showLoading={true}
 *   style={{ height: '100vh' }}
 * />
 * ```
 */
export function GrafanaDashboard({
  baseUrl,
  dashboardUid,
  dashboardSlug = 'dashboard',
  params = {},
  showLoading = true,
  minLoadingTime = DEFAULT_MIN_LOADING_TIME,
  renderBuffer = DEFAULT_RENDER_BUFFER,
  fallbackTimeoutMs = DEFAULT_FALLBACK_TIMEOUT,
  loadingMessage = DEFAULT_LOADING_MESSAGE,
  timeoutMessage = DEFAULT_TIMEOUT_MESSAGE,
  errorMessage = DEFAULT_ERROR_MESSAGE,
  title = DEFAULT_TITLE,
  showRetryButton = true,
  retryButtonText = DEFAULT_RETRY_BUTTON_TEXT,
  onRetry,
  sandbox,
  className,
  style,
}: GrafanaDashboardProps) {
  const searchParams = buildGrafanaParams(params)
  const queryString = searchParams.toString()
  const normalizedBaseUrl = stripTrailingSlash(baseUrl)
  const encodedDashboardUid = encodeURIComponent(dashboardUid)
  const encodedDashboardSlug = encodeURIComponent(dashboardSlug)
  const src = `${normalizedBaseUrl}/d/${encodedDashboardUid}/${encodedDashboardSlug}${queryString ? `?${queryString}` : ''}`

  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'timeout' | 'error'>('loading')
  const [retryAttempt, setRetryAttempt] = useState(0)
  const loadStartTime = useRef(Date.now())
  const hasHandledLoad = useRef(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const canInspectIframe = useRef(true)
  const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const readinessCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hideLoadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Inject the keyframe stylesheet once per page, regardless of how many
  // GrafanaDashboard instances are mounted simultaneously.
  useEffect(() => {
    if (document.getElementById(SPINNER_STYLE_ID)) return
    const el = document.createElement('style')
    el.id = SPINNER_STYLE_ID
    el.textContent = spinnerKeyframes
    document.head.appendChild(el)
  }, [])

  const clearFallbackSignals = useCallback(() => {
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current)
      fallbackTimeoutRef.current = null
    }
    if (readinessCheckIntervalRef.current) {
      clearInterval(readinessCheckIntervalRef.current)
      readinessCheckIntervalRef.current = null
    }
  }, [])

  const clearTimers = useCallback(() => {
    clearFallbackSignals()

    if (hideLoadingTimeoutRef.current) {
      clearTimeout(hideLoadingTimeoutRef.current)
      hideLoadingTimeoutRef.current = null
    }
  }, [clearFallbackSignals])

  useEffect(() => {
    loadStartTime.current = Date.now()
    hasHandledLoad.current = false
    canInspectIframe.current = true
    setLoadState('loading')

    // Every effective navigation owns its timers. Equivalent props that compute
    // the same src must leave an in-flight load or a ready dashboard untouched.
    return clearTimers
  }, [clearTimers, src, retryAttempt])

  const markLoaded = useCallback(() => {
    if (hasHandledLoad.current) {
      return
    }

    hasHandledLoad.current = true
    clearFallbackSignals()

    const elapsed = Date.now() - loadStartTime.current
    const remaining = Math.max(0, minLoadingTime - elapsed)
    const delay = remaining + renderBuffer

    hideLoadingTimeoutRef.current = setTimeout(() => {
      hideLoadingTimeoutRef.current = null
      setLoadState('ready')
    }, delay)
  }, [clearFallbackSignals, minLoadingTime, renderBuffer])

  const handleError = useCallback(() => {
    clearTimers()
    hasHandledLoad.current = true
    setLoadState('error')
  }, [clearTimers])

  const checkReadiness = useCallback((fromLoadEvent = false) => {
    const iframe = iframeRef.current
    if (!iframe) return

    const readiness = inspectNavigation(iframe, fromLoadEvent)
    if (readiness === 'error') {
      handleError()
    } else if (readiness === 'ready') {
      markLoaded()
    } else if (readiness === 'inaccessible') {
      canInspectIframe.current = false
      if (readinessCheckIntervalRef.current) {
        clearInterval(readinessCheckIntervalRef.current)
        readinessCheckIntervalRef.current = null
      }
      if (fromLoadEvent) markLoaded()
    }
  }, [handleError, markLoaded])

  useEffect(() => {
    if (loadState !== 'loading' || hasHandledLoad.current) {
      return
    }

    clearFallbackSignals()
    fallbackTimeoutRef.current = setTimeout(() => {
      setLoadState((current) => (current === 'loading' ? 'timeout' : current))
    }, fallbackTimeoutMs)

    if (canInspectIframe.current) {
      readinessCheckIntervalRef.current = setInterval(() => {
        checkReadiness()
      }, DEFAULT_READINESS_CHECK_INTERVAL)
    }

    return () => {
      clearFallbackSignals()
    }
  }, [checkReadiness, clearFallbackSignals, fallbackTimeoutMs, loadState, src, retryAttempt])

  const handleRetry = useCallback(() => {
    const reason: 'timeout' | 'error' = loadState === 'timeout' ? 'timeout' : 'error'
    const nextAttempt = retryAttempt + 1
    onRetry?.({ attempt: nextAttempt, reason })

    setRetryAttempt(nextAttempt)
  }, [loadState, onRetry, retryAttempt])

  const containerStyles = { ...containerStyle, ...style }
  const resolvedSandbox = sandbox === undefined ? DEFAULT_IFRAME_SANDBOX : sandbox
  const showOverlay = showLoading && loadState !== 'ready'
  const isLoadingState = loadState === 'loading'
  const isErrorState = loadState === 'error' || loadState === 'timeout'
  const showRetryControl = isErrorState && showRetryButton
  const statusMessage =
    loadState === 'timeout' ? timeoutMessage : loadState === 'error' ? errorMessage : loadingMessage

  return (
    <div className={className} style={containerStyles} aria-busy={isLoadingState}>
      {showOverlay && (
        <div style={loadingOverlayStyle}>
          {isLoadingState ? <div style={spinnerStyle} aria-hidden="true" /> : null}
          {isLoadingState ? (
            <output aria-live="polite" aria-label="Loading">
              {statusMessage}
            </output>
          ) : null}
          {isErrorState ? (
            <div aria-live="assertive" role="alert">
              {statusMessage}
            </div>
          ) : null}
          {showRetryControl ? (
            <button type="button" style={retryButtonStyle} onClick={handleRetry}>
              {retryButtonText}
            </button>
          ) : null}
        </div>
      )}
      <iframe
        ref={iframeRef}
        key={`${src}-${retryAttempt}`}
        src={src}
        style={iframeStyle}
        title={title}
        sandbox={resolvedSandbox ?? undefined}
        onLoad={(event) => {
          if (event.currentTarget === iframeRef.current) checkReadiness(true)
        }}
        onError={(event) => {
          if (event.currentTarget === iframeRef.current) handleError()
        }}
      />
    </div>
  )
}
