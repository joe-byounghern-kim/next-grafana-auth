'use client'

import { GrafanaDashboard } from 'next-grafana-auth/component'

export default function DashboardPage() {
  return (
    <div style={{ height: '100vh', width: '100%', margin: 0, padding: 0 }}>
      <GrafanaDashboard
        baseUrl="/api/grafana"
        dashboardUid="demo-dashboard" // Pre-configured dashboard in Grafana
        dashboardSlug="demo-dashboard"
        params={{
          kiosk: true,
          theme: 'dark',
          from: 'now-1h',
          to: 'now',
        }}
      />
    </div>
  )
}
