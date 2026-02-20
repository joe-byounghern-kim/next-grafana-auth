// In-memory session store (in production, use Redis, database, etc.)
interface User {
  email: string
  role: 'Admin' | 'Editor' | 'Viewer'
}

interface Session {
  id: string
  userId: string
  user: User
  createdAt: Date
  expiresAt: Date
}

const sessions = new Map<string, Session>()
const users = new Map<string, User>()

// Demo users (in production, store in database)
users.set('admin@example.com', {
  email: 'admin@example.com',
  role: 'Admin',
})
users.set('user@example.com', {
  email: 'user@example.com',
  role: 'Viewer',
})

const SESSION_TTL = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export async function getUserBySessionId(sessionId: string | undefined) {
  if (!sessionId) return null

  const session = sessions.get(sessionId)

  if (!session) return null

  // Check if session is expired
  if (session.expiresAt < new Date()) {
    sessions.delete(sessionId)
    return null
  }

  return session.user
}

export async function createSession(email: string, password: string) {
  // Validate credentials (in production, use password hashing)
  const user = users.get(email)

  if (!user) {
    throw new Error('Invalid credentials')
  }

  // Demo: simple password check (IN PRODUCTION: Use bcrypt!)
  const passwords: Record<string, string> = {
    'admin@example.com': 'admin123',
    'user@example.com': 'user123',
  }

  if (passwords[email] !== password) {
    throw new Error('Invalid credentials')
  }

  // Create session
  const sessionId = generateSessionId()
  const session: Session = {
    id: sessionId,
    userId: email,
    user,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + SESSION_TTL),
  }

  sessions.set(sessionId, session)

  return sessionId
}

export async function deleteSession(sessionId: string) {
  sessions.delete(sessionId)
}

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

// Cleanup expired sessions (run periodically)
export function cleanupExpiredSessions() {
  const now = new Date()

  for (const [sessionId, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(sessionId)
    }
  }
}

// Auto-cleanup every hour (in production, use a proper job scheduler)
if (typeof window === 'undefined') {
  setInterval(cleanupExpiredSessions, 60 * 60 * 1000)
}
