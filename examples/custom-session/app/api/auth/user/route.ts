import { cookies } from 'next/headers'
import { getUserBySessionId } from '@/lib/session'

export async function GET() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('sessionId')?.value

  const user = await getUserBySessionId(sessionId)

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return Response.json({ email: user.email, role: user.role })
}
