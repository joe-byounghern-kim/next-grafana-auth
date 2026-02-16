'use client'

import { signOut, useSession } from 'next-auth/react'
import { GrafanaDashboard } from 'next-grafana-auth/component'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [health, setHealth] = useState<unknown>(null)
  const [healthError, setHealthError] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') {
      return
    }

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
  }, [status])

  if (status === 'loading' || !session) {
    return <div style={{ padding: '2rem' }}>Loading...</div>
  }

  const userName = session.user?.name ?? 'Unknown User'
  const userEmail = session.user?.email ?? 'unknown@example.com'
  const userRole =
    session.user && 'role' in session.user && typeof session.user.role === 'string'
      ? session.user.role
      : 'Viewer'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header
        style={{
          padding: '1rem 2rem',
          background: '#1a1a1a',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Grafana Dashboard</h2>
          <small>
            {userName} ({userEmail}) - {userRole}
          </small>
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          style={{
            padding: '0.5rem 1rem',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </header>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <h2 style={{ margin: 0, marginBottom: '0.5rem', color: '#111827' }}>
            Grafana Connectivity Check
          </h2>
          {healthError ? (
            <p style={{ margin: 0, color: '#dc2626' }}>{healthError}</p>
          ) : (
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#111827' }}>
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
    </div>
  )
}
