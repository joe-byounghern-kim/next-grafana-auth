import { handleGrafanaProxy } from 'next-grafana-auth'
import type { NextRequest } from 'next/server'

// Simple demo user - in production, use your auth system
const DEMO_USER = {
  email: 'demo@example.com',
  role: 'Viewer' as const,
}

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const grafanaUrl = process.env.GRAFANA_INTERNAL_URL

  if (!grafanaUrl) {
    return Response.json(
      { error: 'Missing GRAFANA_INTERNAL_URL environment variable' },
      { status: 500 }
    )
  }

  return handleGrafanaProxy(request, {
    grafanaUrl,
    userEmail: DEMO_USER.email,
    userRole: DEMO_USER.role,
  }, (await params).path)
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH }
