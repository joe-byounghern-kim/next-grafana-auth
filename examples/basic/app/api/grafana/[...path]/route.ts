import { handleGrafanaProxy } from 'next-grafana-auth'
import type { NextRequest } from 'next/server'

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

  // Demo: hardcoded user for testing.
  // In production, validate a session cookie and load the real user.
  // See the nextauth/ and custom-session/ examples for realistic auth.
  const user = {
    email: 'user@example.com',
    role: 'Admin' as const,
  }

  return handleGrafanaProxy(request, {
    grafanaUrl,
    userEmail: user.email,
    userRole: user.role,
  }, (await params).path)
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH }
