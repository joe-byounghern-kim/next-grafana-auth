// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GrafanaDashboard } from '../src/component'
import type { GrafanaDashboardProps } from '../src/types'

const initialProps: GrafanaDashboardProps = {
  baseUrl: '/api/grafana',
  dashboardUid: 'first',
  dashboardSlug: 'dashboard',
  minLoadingTime: 100,
  renderBuffer: 50,
  fallbackTimeoutMs: 1000,
}

const getIframe = () => screen.getByTitle('Grafana Dashboard') as HTMLIFrameElement
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))

// jsdom does not navigate iframe documents. Model the completed response at the
// browser boundary, separately from the requested src (especially for redirects).
function setNavigation(
  iframe: HTMLIFrameElement,
  {
    url = `http://localhost${iframe.getAttribute('src')}`,
    contentType = 'text/html',
    readyState = 'complete',
    body = '<div id="reactRoot">Dashboard</div>',
  }: { url?: string; contentType?: string; readyState?: DocumentReadyState; body?: string } = {},
) {
  const doc = document.implementation.createHTMLDocument()
  doc.body.innerHTML = body
  Object.defineProperties(doc, {
    contentType: { value: contentType },
    readyState: { value: readyState },
    URL: { value: url },
  })
  Object.defineProperties(iframe, {
    contentDocument: { configurable: true, get: () => doc },
    contentWindow: { configurable: true, get: () => ({ document: doc, location: new URL(url) }) },
  })
}

function completeLoad(iframe = getIframe()) {
  setNavigation(iframe)
  fireEvent.load(iframe)
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  expect(vi.getTimerCount()).toBe(0)
  vi.useRealTimers()
})

describe('effective dashboard src lifecycle', () => {
  it.each([
    ['UID', { dashboardUid: 'second' }],
    ['slug', { dashboardSlug: 'renamed' }],
    ['baseUrl', { baseUrl: '/other/grafana' }],
    ['params', { params: { theme: 'dark' as const } }],
  ])('starts a fresh load from ready when %s changes', (_, change) => {
    const { rerender, container } = render(<GrafanaDashboard {...initialProps} />)
    const firstIframe = getIframe()
    completeLoad()
    advance(150)
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument()

    rerender(<GrafanaDashboard {...initialProps} {...change} />)
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true')
    expect(getIframe()).not.toBe(firstIframe)
    completeLoad()
    advance(149)
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
    advance(1)
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('aria-busy', 'false')
    expect(vi.getTimerCount()).toBe(0)
  })

  it.each(['timeout', 'error'])('clears the old %s and re-arms timeout for a new src', (state) => {
    const { rerender } = render(<GrafanaDashboard {...initialProps} />)
    if (state === 'timeout') advance(1000)
    else {
      setNavigation(getIframe(), { contentType: 'application/json', body: '<pre>{"error":"Unauthorized"}</pre>' })
      fireEvent.load(getIframe())
    }
    expect(screen.getByRole('alert')).toBeInTheDocument()

    rerender(<GrafanaDashboard {...initialProps} params={{ theme: 'dark' }} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
    advance(999)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    advance(1)
    expect(screen.getByRole('alert')).toHaveTextContent('taking longer than expected')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('cancels the old render buffer and ignores detached iframe events after a src change', () => {
    const { rerender } = render(<GrafanaDashboard {...initialProps} renderBuffer={300} />)
    const oldIframe = getIframe()
    completeLoad()
    advance(100)
    rerender(<GrafanaDashboard {...initialProps} renderBuffer={300} dashboardUid="second" />)
    advance(300)
    fireEvent.load(oldIframe)
    fireEvent.error(oldIframe, { bubbles: true })
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    completeLoad()
    advance(299)
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
    advance(1)
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('cancels the old pending fallback deadline on navigation', () => {
    const { rerender } = render(<GrafanaDashboard {...initialProps} />)
    advance(900)
    rerender(<GrafanaDashboard {...initialProps} params={{ from: 'now-1h' }} />)
    advance(100)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    advance(899)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    advance(1)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('does not reset ready state or remount for equivalent computed src values', () => {
    const { rerender } = render(
      <GrafanaDashboard {...initialProps} params={{ kiosk: true, variables: { host: ['a', 'b'] } }} />,
    )
    completeLoad()
    advance(150)
    const iframe = getIframe()
    rerender(
      <GrafanaDashboard
        {...initialProps}
        baseUrl="/api/grafana/"
        params={{ kiosk: true, variables: { host: ['a', 'b'] } }}
      />,
    )
    expect(getIframe()).toBe(iframe)
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('preserves a pending render buffer when an equivalent params object is supplied', () => {
    const { rerender } = render(<GrafanaDashboard {...initialProps} params={{ theme: 'dark' }} />)
    completeLoad()
    advance(100)
    rerender(<GrafanaDashboard {...initialProps} params={{ theme: 'dark' }} />)
    advance(50)
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('re-enables DOM inspection after a previously inaccessible iframe changes src', () => {
    const { rerender } = render(<GrafanaDashboard {...initialProps} />)
    Object.defineProperty(getIframe(), 'contentWindow', {
      configurable: true,
      get: () => { throw new DOMException('Cross-origin access denied', 'SecurityError') },
    })
    advance(250)
    rerender(<GrafanaDashboard {...initialProps} dashboardUid="second" />)
    setNavigation(getIframe())
    advance(250)
    advance(50)
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('completed iframe navigation inspection', () => {
  it.each(['application/json', 'application/problem+json'])('rejects a %s response on the dashboard URL', (contentType) => {
    render(<GrafanaDashboard {...initialProps} />)
    setNavigation(getIframe(), { contentType, body: '<pre>{"error":"Unauthorized"}</pre>' })
    fireEvent.load(getIframe())
    advance(1500)
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load dashboard')
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    expect(vi.getTimerCount()).toBe(0)
  })

  it.each(['load', 'poll'])('rejects completed /login redirects via %s instead of trusting iframe src', (signal) => {
    render(<GrafanaDashboard {...initialProps} />)
    const iframe = getIframe()
    setNavigation(iframe, { url: 'http://localhost/api/grafana/login', body: '<form>Sign in</form>' })
    if (signal === 'load') fireEvent.load(iframe)
    else advance(250)
    expect(iframe).toHaveAttribute('src', '/api/grafana/d/first/dashboard')
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load dashboard')
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    advance(1500)
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load dashboard')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('rejects JSON during readiness polling without a load event', () => {
    render(<GrafanaDashboard {...initialProps} />)
    setNavigation(getIframe(), { contentType: 'application/json', body: '<pre>{"error":"Bad Gateway"}</pre>' })
    advance(250)
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load dashboard')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('retries an inspected error with a fresh iframe and can then load successfully', () => {
    const onRetry = vi.fn()
    render(<GrafanaDashboard {...initialProps} onRetry={onRetry} />)
    const oldIframe = getIframe()
    setNavigation(oldIframe, { url: 'http://localhost/api/grafana/login' })
    fireEvent.load(oldIframe)
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledWith({ attempt: 1, reason: 'error' })
    expect(getIframe()).not.toBe(oldIframe)
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
    completeLoad()
    advance(150)
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(vi.getTimerCount()).toBe(0)
  })

  it.each(['load', 'poll'])('accepts valid completed HTML at an existing /d/ dashboard path via %s', (signal) => {
    render(<GrafanaDashboard {...initialProps} />)
    setNavigation(getIframe(), { url: 'http://localhost/custom/prefix/d/first/canonical-slug?orgId=1' })
    if (signal === 'load') fireEvent.load(getIframe())
    else advance(250)
    advance(150)
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('ignores a transient about:blank onLoad before the dashboard completes', () => {
    render(<GrafanaDashboard {...initialProps} />)
    setNavigation(getIframe(), { url: 'about:blank', body: '' })
    fireEvent.load(getIframe())
    advance(300)
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    completeLoad()
    advance(50)
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('does not classify an incomplete redirect document as an error', () => {
    render(<GrafanaDashboard {...initialProps} />)
    setNavigation(getIframe(), { url: 'http://localhost/api/grafana/login', readyState: 'loading' })
    advance(250)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    completeLoad()
    advance(50)
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument()
  })

  it.each(['security-exception', 'null-document'])('preserves inaccessible cross-origin onLoad fallback for %s', (mode) => {
    render(<GrafanaDashboard {...initialProps} baseUrl="https://grafana.example.com" />)
    const iframe = getIframe()
    if (mode === 'security-exception') {
      Object.defineProperty(iframe, 'contentWindow', {
        configurable: true,
        get: () => { throw new DOMException('Cross-origin access denied', 'SecurityError') },
      })
    } else {
      Object.defineProperty(iframe, 'contentDocument', { configurable: true, get: () => null })
    }
    advance(250)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    fireEvent.load(iframe)
    advance(50)
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('cancels a pending ready callback when a completed navigation becomes an error', () => {
    render(<GrafanaDashboard {...initialProps} renderBuffer={500} />)
    completeLoad()
    advance(100)
    setNavigation(getIframe(), { url: 'http://localhost/api/grafana/login' })
    fireEvent.load(getIframe())
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load dashboard')
    advance(1000)
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load dashboard')
    expect(vi.getTimerCount()).toBe(0)
  })
})
