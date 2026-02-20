import { handleGrafanaProxy } from 'next-grafana-auth'
import { cookies } from 'next/headers'
import { getUserBySessionId } from '@/lib/session'
import type { NextRequest } from 'next/server'

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('sessionId')?.value

  const user = await getUserBySessionId(sessionId)

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const grafanaUrl = process.env.GRAFANA_INTERNAL_URL

  if (!grafanaUrl) {
    return Response.json(
      { error: 'Missing GRAFANA_INTERNAL_URL environment variable' },
      { status: 500 }
    )
  }

  return handleGrafanaProxy(request, {
    grafanaUrl,
    userEmail: user.email,
    userRole: user.role,
  }, (await params).path)
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH }
