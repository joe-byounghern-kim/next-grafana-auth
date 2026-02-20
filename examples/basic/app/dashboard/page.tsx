'use client'

import { GrafanaDashboard } from 'next-grafana-auth/component'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const [health, setHealth] = useState<unknown>(null)
  const [healthError, setHealthError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHealth() {
      try {
        const response = await fetch('/api/grafana/api/health')

        if (!response.ok) {
          setHealthError(`Failed to load health data (${response.status})`)
          return
        }

        const data = await response.json()
        setHealth(data)
      } catch (error) {
        console.error('Failed to fetch Grafana health:', error)
        setHealthError('Failed to load health data')
      }
    }

    fetchHealth()
  }, [])

  return (
    <div style={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
        <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>Grafana Connectivity Check</h2>
        {healthError ? (
          <p style={{ margin: 0, color: '#dc2626' }}>{healthError}</p>
        ) : (
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {health ? JSON.stringify(health, null, 2) : 'Loading /api/grafana/api/health ...'}
          </pre>
        )}
      </div>

      <GrafanaDashboard
        baseUrl="/api/grafana"
        dashboardUid="demo-dashboard"
        dashboardSlug="demo-dashboard"
        params={{ kiosk: true, theme: 'dark', from: 'now-1h', to: 'now' }}
        style={{ flex: 1 }}
      />
    </div>
  )
}
