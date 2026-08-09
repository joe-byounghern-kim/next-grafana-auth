interface User {
  email: string
  role: 'Admin' | 'Editor' | 'Viewer'
}

interface DemoAccount {
  password: string
  user: User
}

interface Session {
  user: User
  expiresAt: number
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000
const sessions = new Map<string, Session>()
const demoAccounts = new Map<string, DemoAccount>([
  [
    'admin@example.com',
    {
      password: 'admin123',
      user: { email: 'admin@example.com', role: 'Admin' },
    },
  ],
  [
    'user@example.com',
    {
      password: 'user123',
      user: { email: 'user@example.com', role: 'Viewer' },
    },
  ],
])

function deleteExpiredSessions(now: number): void {
  for (const [sessionId, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(sessionId)
  }
}

export function getUserBySessionId(sessionId: string | undefined): User | null {
  if (!sessionId) return null

  const session = sessions.get(sessionId)
  if (!session) return null
  if (session.expiresAt <= Date.now()) {
    sessions.delete(sessionId)
    return null
  }

  return session.user
}

export function createSession(email: string, password: string): string {
  const account = demoAccounts.get(email)
  if (!account || account.password !== password) {
    throw new Error('Invalid credentials')
  }

  const now = Date.now()
  deleteExpiredSessions(now)
  const sessionId = crypto.randomUUID()
  sessions.set(sessionId, {
    user: account.user,
    expiresAt: now + SESSION_TTL_MS,
  })
  return sessionId
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId)
}
