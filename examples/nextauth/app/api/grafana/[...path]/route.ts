import { handleGrafanaProxy } from 'next-grafana-auth'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import type { NextRequest } from 'next/server'

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Map NextAuth role to Grafana role
  const userRole = session.user.role || 'Viewer'
  const grafanaUrl = process.env.GRAFANA_INTERNAL_URL

  if (!grafanaUrl) {
    return Response.json(
      { error: 'Missing GRAFANA_INTERNAL_URL environment variable' },
      { status: 500 }
    )
  }

  return handleGrafanaProxy(request, {
    grafanaUrl,
    userEmail: session.user.email,
    userRole,
  }, (await params).path)
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH }
