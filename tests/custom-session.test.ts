import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createSession,
  deleteSession,
  getUserBySessionId,
} from '../examples/custom-session/app/lib/session'

afterEach(() => {
  vi.useRealTimers()
})

describe('custom-session demo store', () => {
  it('creates UUID sessions for valid demo credentials', async () => {
    const sessionId = await createSession('admin@example.com', 'admin123')

    expect(sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
    expect(await getUserBySessionId(sessionId)).toEqual({
      email: 'admin@example.com',
      role: 'Admin',
    })
    await deleteSession(sessionId)
  })

  it('deletes an expired session during lookup', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-08T00:00:00Z'))
    const sessionId = await createSession('user@example.com', 'user123')

    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1)

    expect(await getUserBySessionId(sessionId)).toBeNull()
  })

  it('deletes a session explicitly', async () => {
    const sessionId = await createSession('user@example.com', 'user123')
    await deleteSession(sessionId)

    expect(await getUserBySessionId(sessionId)).toBeNull()
  })

  it('rejects invalid demo credentials', async () => {
    await expect(
      Promise.resolve().then(() => createSession('admin@example.com', 'wrong'))
    ).rejects.toThrow('Invalid credentials')
  })
})
