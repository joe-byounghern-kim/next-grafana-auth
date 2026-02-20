# Custom Session Example - next-grafana-auth

Production-like example with custom session-based authentication, similar to Operator Client (OC) implementation.

## Setup

1. **Install dependencies:**
```bash
cd examples/custom-session
npm ci
```

2. **Configure environment:**
```bash
cp .env.example .env
```

Edit `.env` if needed (defaults to `http://localhost:3001` for host-run Next.js).

3. **Start Grafana:**
```bash
cd ..
docker compose up -d
```

4. **Start Next.js:**
```bash
cd examples/custom-session
npm run dev
```

5. **Visit:**
- Home: http://localhost:3000
- Sign in: http://localhost:3000/signin
- Dashboard: http://localhost:3000/dashboard

## Demo Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | admin123 | Admin |
| user@example.com | user123 | Viewer |

⚠️ **These are demo credentials. In production, use your own user database.**

## Configuration

Open `/dashboard` after sign-in to verify Grafana loads through the `/api/grafana` proxy.
The examples stack provisions a demo dashboard (`uid: demo-dashboard`) with 5 panels (time series, stat, gauge, bar chart, bar gauge) using Grafana's built-in TestData datasource — live mock data is generated automatically on any machine.
The page checks `GET /api/grafana/api/health` and embeds the provisioned `demo-dashboard` via `<GrafanaDashboard />`.
If something looks wrong, check server logs for proxy/auth-header forwarding.

## Architecture

### Session Flow

1. **Sign In:**
   - User submits credentials to `/api/auth/signin`
   - Server validates credentials
   - Server creates session with TTL
   - Server sets `sessionId` cookie (httpOnly)
   - User redirected to dashboard

2. **Access Protected Route:**
   - Client requests `/api/grafana/...`
   - Server reads `sessionId` cookie
   - Server validates session (exists, not expired)
   - Server fetches user from session
   - Proxy forwards to Grafana with auth headers

3. **Sign Out:**
   - User clicks sign out
   - Client requests `/api/auth/signout`
   - Server deletes session from store
   - Server clears `sessionId` cookie
   - User redirected to home

### Session Store

The example uses an in-memory Map for sessions:

```typescript
interface Session {
  id: string
  userId: string
  user: { email: string; role: string }
  createdAt: Date
  expiresAt: Date
}
```

**Features:**
- Automatic expiration (24 hours)
- Periodic cleanup (every hour)
- Session validation before access

### API Endpoints

- `POST /api/auth/signin` - Create session
- `POST /api/auth/signout` - Delete session
- `GET /api/auth/user` - Get current user
- `GET|POST|PUT|DELETE|PATCH /api/grafana/[...path]` - Proxy to Grafana

## Files

- `app/lib/session.ts` - Session management utilities
- `app/api/auth/signin/route.ts` - Sign-in endpoint
- `app/api/auth/signout/route.ts` - Sign-out endpoint
- `app/api/auth/user/route.ts` - User info endpoint
- `app/api/grafana/[...path]/route.ts` - Proxy with session validation
- `app/signin/page.tsx` - Sign-in page
- `app/dashboard/page.tsx` - Dashboard with embedded Grafana
- `app/page.tsx` - Home page with auth check

## Customization for Production

### Replace In-Memory Session Store

**Using Redis:**

```typescript
import { Redis } from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export async function createSession(email: string, password: string) {
  const sessionId = generateSessionId()
  const session = {
    email,
    role: user.role,
    createdAt: Date.now(),
  }

  await redis.setex(
    `session:${sessionId}`,
    24 * 60 * 60, // 24 hours
    JSON.stringify(session)
  )

  return sessionId
}

export async function getUserBySessionId(sessionId: string) {
  const data = await redis.get(`session:${sessionId}`)
  if (!data) return null

  return JSON.parse(data)
}

export async function deleteSession(sessionId: string) {
  await redis.del(`session:${sessionId}`)
}
```

**Using Database (Prisma):**

```typescript
import { prisma } from '@/lib/prisma'

export async function createSession(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  })

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })

  return session.id
}

export async function getUserBySessionId(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) {
    return null
  }

  return session.user
}
```

### Add Password Hashing

```typescript
import bcrypt from 'bcrypt'

export async function createSession(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  })

  const isValid = await bcrypt.compare(password, user.passwordHash)

  if (!isValid) {
    throw new Error('Invalid credentials')
  }

  // ... create session
}

// When creating user:
const passwordHash = await bcrypt.hash(password, 10)
await prisma.user.create({
  data: { email, passwordHash },
})
```

### Add Rate Limiting

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
})

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'

  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return Response.json({ error: 'Too many requests' }, { status: 429 })
  }

  // ... sign in logic
}
```

## Security Notes

- **DO NOT** use in-memory session store in production
- **ALWAYS** hash passwords (bcrypt, argon2)
- **ALWAYS** use HTTPS in production
- **DO** implement rate limiting on auth endpoints
- **DO** validate and sanitize all inputs
- **DO** use httpOnly cookies for sessions
- **DO** set secure and sameSite cookie flags
- **DO** implement CSRF protection
- **DO** log authentication events (but never log passwords!)

## Monitoring

**Track metrics:**
- Failed login attempts (detect brute force)
- Successful logins (track user activity)
- Session creation/deletion rates
- Response times for auth endpoints

**Alert on:**
- High rate of failed logins
- Unusual session creation patterns
- Authentication errors in Grafana proxy

## Troubleshooting

See main [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md) for common issues.

### Session Issues

**Session not persisting:**
- Check cookie settings (httpOnly, sameSite)
- Verify cookie is being set in browser DevTools
- Check session expiration time

**Session expired too soon:**
- Verify TTL settings
- Check server time is synchronized
- Look for cleanup jobs deleting sessions

**Can't sign out:**
- Check `/api/auth/signout` is responding
- Verify session deletion logic
- Check cookie is being cleared

## Comparison with Other Examples

| Feature | Basic | NextAuth | Custom Session |
|---------|--------|----------|----------------|
| Session Store | In-memory | JWT | In-memory (extensible) |
| Auth Provider | None | Credentials/OAuth | Credentials |
| User Database | Hardcoded | Configurable | Configurable |
| Production Ready | No | Yes | With modifications |
| Customization | High | Medium | Very High |
| Complexity | Low | Medium | High |

**Choose Custom Session if:**
- You have an existing auth system
- You need full control over sessions
- You want to integrate with your database
- You need custom auth logic

**Choose NextAuth if:**
- You want OAuth (Google, GitHub, etc.)
- You want a battle-tested solution
- You don't need custom session logic
- You want quick setup
