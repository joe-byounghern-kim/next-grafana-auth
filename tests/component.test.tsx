import { act, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GrafanaDashboard } from '../src/component'

Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
  },
  writable: true,
})

describe('GrafanaDashboard', () => {
  it('should render iframe with correct src', () => {
    render(
      <GrafanaDashboard
        baseUrl="/api/grafana"
        dashboardUid="test-uid"
        dashboardSlug="test-slug"
        params={{ kiosk: true, theme: 'dark' }}
        showLoading={false}
      />
    )

    const iframe = screen.getByTitle('Grafana Dashboard')
    expect(iframe).toBeInTheDocument()
    expect(iframe).toHaveAttribute(
      'src',
      '/api/grafana/d/test-uid/test-slug?kiosk=1&theme=dark'
    )
  })

  it('should use default dashboardSlug when not provided', () => {
    render(
      <GrafanaDashboard
        baseUrl="/api/grafana"
        dashboardUid="test-uid"
        showLoading={false}
      />
    )

    const iframe = screen.getByTitle('Grafana Dashboard')
    expect(iframe).toHaveAttribute(
      'src',
      '/api/grafana/d/test-uid/dashboard'
    )
  })

  it('should apply custom className and style', () => {
    const { container } = render(
      <GrafanaDashboard
        baseUrl="/api/grafana"
        dashboardUid="test-uid"
        className="custom-class"
        style={{ height: '500px' }}
        showLoading={false}
      />
    )

    const div = container.querySelector('.custom-class')
    expect(div).toBeInTheDocument()
    expect(div).toHaveStyle({ height: '500px' })
  })

  it('should show loading overlay when showLoading is true', () => {
    render(
      <GrafanaDashboard
        baseUrl="/api/grafana"
        dashboardUid="test-uid"
        showLoading={true}
      />
    )

    const loadingOverlay = screen.getByRole('status', { name: 'Loading' })
    expect(loadingOverlay).toBeInTheDocument()
    expect(loadingOverlay).toHaveTextContent('Loading dashboard...')
  })

  it('should hide loading overlay after minimum time + buffer', () => {
    vi.useFakeTimers()

    render(
      <GrafanaDashboard
        baseUrl="/api/grafana"
        dashboardUid="test-uid"
        showLoading={true}
        minLoadingTime={100}
        renderBuffer={50}
      />
    )

    // Initially loading
    expect(screen.queryByRole('status', { name: 'Loading' })).toBeInTheDocument()

    // Simulate iframe load event
    const iframe = screen.getByTitle('Grafana Dashboard')

    act(() => {
      iframe.dispatchEvent(new Event('load'))
    })

    // Still loading because of minLoadingTime
    expect(screen.queryByRole('status', { name: 'Loading' })).toBeInTheDocument()

    // Fast-forward past minLoadingTime + renderBuffer
    act(() => {
      vi.advanceTimersByTime(151)
    })

    // Loading should be hidden
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument()

    vi.useRealTimers()
  })

  it.skip('should show error overlay on iframe error', async () => {
    vi.useFakeTimers()

    render(
      <GrafanaDashboard
        baseUrl="/api/grafana"
        dashboardUid="test-uid"
        showLoading={true}
      />
    )

    const iframe = screen.getByTitle('Grafana Dashboard')

    act(() => {
      iframe.dispatchEvent(new Event('error'))
    })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    vi.useRealTimers()
  })

  it('should hide loading overlay after fallback timeout', () => {
    vi.useFakeTimers()

    render(
      <GrafanaDashboard
        baseUrl="/api/grafana"
        dashboardUid="test-uid"
        showLoading={true}
      />
    )

    // Initially loading
    expect(screen.queryByRole('status', { name: 'Loading' })).toBeInTheDocument()

    // Fast-forward past fallback timeout (10000ms)
    act(() => {
      vi.advanceTimersByTime(10001)
    })

    const timeoutAlert = screen.getByRole('alert')
    expect(timeoutAlert).toBeInTheDocument()
    expect(timeoutAlert).toHaveTextContent('Dashboard is taking longer than expected to load.')

    vi.useRealTimers()
  })

  it('should support custom fallback timeout and timeout message', () => {
    vi.useFakeTimers()

    render(
      <GrafanaDashboard
        baseUrl="/api/grafana"
        dashboardUid="test-uid"
        showLoading={true}
        fallbackTimeoutMs={500}
        timeoutMessage="Still loading. Check your network and auth session."
      />
    )

    act(() => {
      vi.advanceTimersByTime(501)
    })

    const timeoutAlert = screen.getByRole('alert')
    expect(timeoutAlert).toBeInTheDocument()
    expect(timeoutAlert).toHaveTextContent('Still loading. Check your network and auth session.')

    vi.useRealTimers()
  })

  it('should show retry button after timeout', () => {
    vi.useFakeTimers()

    render(
      <GrafanaDashboard
        baseUrl="/api/grafana"
        dashboardUid="test-uid"
        showLoading={true}
      />
    )

    act(() => {
      vi.advanceTimersByTime(10001)
    })

    const retryButton = screen.getByRole('button', { name: 'Retry' })
    expect(retryButton).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('should return to loading state and re-arm timeout after retry', () => {
    vi.useFakeTimers()

    render(
      <GrafanaDashboard
        baseUrl="/api/grafana"
        dashboardUid="test-uid"
        showLoading={true}
      />
    )

    act(() => {
      vi.advanceTimersByTime(10001)
    })

    const retryButton = screen.getByRole('button', { name: 'Retry' })
    act(() => {
      retryButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(screen.queryByRole('status', { name: 'Loading' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(10001)
    })

    expect(screen.getByRole('alert')).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('should call onRetry callback with attempt and reason', () => {
    vi.useFakeTimers()

    const onRetry = vi.fn()

    render(
      <GrafanaDashboard
        baseUrl="/api/grafana"
        dashboardUid="test-uid"
        showLoading={true}
        onRetry={onRetry}
      />
    )

    act(() => {
      vi.advanceTimersByTime(10001)
    })

    const retryButton = screen.getByRole('button', { name: 'Retry' })
    act(() => {
      retryButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onRetry).toHaveBeenCalledWith({ attempt: 1, reason: 'timeout' })

    vi.useRealTimers()
  })

  it('should hide loading after retry and subsequent iframe load', () => {
    vi.useFakeTimers()

    render(
      <GrafanaDashboard
        baseUrl="/api/grafana"
        dashboardUid="test-uid"
        showLoading={true}
        minLoadingTime={100}
        renderBuffer={50}
      />
    )

    act(() => {
      vi.advanceTimersByTime(10001)
    })

    const retryButton = screen.getByRole('button', { name: 'Retry' })
    act(() => {
      retryButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const iframe = screen.getByTitle('Grafana Dashboard')
    act(() => {
      iframe.dispatchEvent(new Event('load'))
    })

    act(() => {
      vi.advanceTimersByTime(151)
    })

    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    vi.useRealTimers()
  })

  it('should hide retry button when showRetryButton is false', () => {
    vi.useFakeTimers()

    render(
      <GrafanaDashboard
        baseUrl="/api/grafana"
        dashboardUid="test-uid"
        showLoading={true}
        showRetryButton={false}
      />
    )

    act(() => {
      vi.advanceTimersByTime(10001)
    })

    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()

    vi.useRealTimers()
  })

  it('should hide loading after first iframe load even if load fires again', () => {
    vi.useFakeTimers()

    render(
      <GrafanaDashboard
        baseUrl="/api/grafana"
        dashboardUid="test-uid"
        showLoading={true}
        minLoadingTime={0}
        renderBuffer={100}
      />
    )

    const iframe = screen.getByTitle('Grafana Dashboard')

    act(() => {
      iframe.dispatchEvent(new Event('load'))
    })

    act(() => {
      vi.advanceTimersByTime(50)
      iframe.dispatchEvent(new Event('load'))
      vi.advanceTimersByTime(40)
      iframe.dispatchEvent(new Event('load'))
      vi.advanceTimersByTime(11)
    })

    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    vi.useRealTimers()
  })

  it('should still hide loading when fallback timeout prop changes after iframe load', () => {
    vi.useFakeTimers()

    const { rerender } = render(
      <GrafanaDashboard
        baseUrl="/api/grafana"
        dashboardUid="test-uid"
        showLoading={true}
        minLoadingTime={0}
        renderBuffer={100}
        fallbackTimeoutMs={10000}
      />
    )

    const iframe = screen.getByTitle('Grafana Dashboard')
    act(() => {
      iframe.dispatchEvent(new Event('load'))
    })

    rerender(
      <GrafanaDashboard
        baseUrl="/api/grafana"
        dashboardUid="test-uid"
        showLoading={true}
        minLoadingTime={0}
        renderBuffer={100}
        fallbackTimeoutMs={5000}
      />
    )

    act(() => {
      vi.advanceTimersByTime(101)
    })

    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    vi.useRealTimers()
  })

  it('should apply custom iframe title', () => {
    render(
      <GrafanaDashboard
        baseUrl="/api/grafana"
        dashboardUid="test-uid"
        title="Ops Dashboard"
        showLoading={false}
      />
    )

    const iframe = screen.getByTitle('Ops Dashboard')
    expect(iframe).toBeInTheDocument()
  })

  it('should build URL params correctly with template variables', () => {
    render(
      <GrafanaDashboard
        baseUrl="/api/grafana"
        dashboardUid="test-uid"
        params={{
          kiosk: 'tv',
          refresh: '5s',
          from: 'now-1h',
          to: 'now',
          variables: {
            host: 'server1',
            region: ['us-east', 'us-west'],
          },
        }}
        showLoading={false}
      />
    )

    const iframe = screen.getByTitle('Grafana Dashboard')
    expect(iframe).toHaveAttribute(
      'src',
      expect.stringContaining('kiosk=tv')
    )
    expect(iframe).toHaveAttribute(
      'src',
      expect.stringContaining('refresh=5s')
    )
    expect(iframe).toHaveAttribute(
      'src',
      expect.stringContaining('from=now-1h')
    )
    expect(iframe).toHaveAttribute(
      'src',
      expect.stringContaining('to=now')
    )
    expect(iframe).toHaveAttribute(
      'src',
      expect.stringContaining('var-host=server1')
    )
  })
})
