import { cookies } from 'next/headers'
import { deleteSession } from '@/lib/session'

export async function POST() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('sessionId')?.value

  if (sessionId) {
    deleteSession(sessionId)
    cookieStore.delete('sessionId')
  }

  return Response.json({ success: true })
}
