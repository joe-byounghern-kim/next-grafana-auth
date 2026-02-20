# NextAuth.js Example - next-grafana-auth

Complete example integrating NextAuth.js authentication with next-grafana-auth.

## Setup

1. **Install dependencies:**
```bash
cd examples/nextauth
npm ci
```

2. **Configure environment:**
```bash
cp .env.example .env
```

Edit `.env`:
- `GRAFANA_INTERNAL_URL` - Grafana server URL (default: `http://localhost:3001` for host-run Next.js)
- `NEXTAUTH_SECRET` - Generate a random secret (required!)
- `NEXTAUTH_URL` - Your app URL (default: `http://localhost:3000`)

Generate a secret:
```bash
openssl rand -base64 32
```

3. **Start Grafana:**
```bash
cd ..
docker compose up -d
```

4. **Start Next.js:**
```bash
cd examples/nextauth
npm run dev
```

5. **Visit:**
- Home: http://localhost:3000
- Sign in: http://localhost:3000/signin
- Dashboard: http://localhost:3000/dashboard

## Demo Credentials

The demo includes two pre-configured users:

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | admin123 | Admin |
| user@example.com | user123 | Viewer |

⚠️ **These are demo credentials. In production, use your own authentication provider.**

## Configuration

Open `/dashboard` after sign-in to verify Grafana loads through the `/api/grafana` proxy.
The examples stack provisions a demo dashboard (`uid: demo-dashboard`) with 5 panels (time series, stat, gauge, bar chart, bar gauge) using Grafana's built-in TestData datasource — live mock data is generated automatically on any machine.
The page checks `GET /api/grafana/api/health` and embeds the provisioned `demo-dashboard` via `<GrafanaDashboard />`.
If something looks wrong, check server logs for proxy/auth-header forwarding.

## How It Works

1. **Authentication Flow:**
   - User signs in via NextAuth.js credentials provider
   - NextAuth creates a JWT session
   - Session contains email, name, and role

2. **Proxy Handler:**
   - Validates NextAuth session
   - Extracts user email and role
   - Forwards to Grafana with auth-proxy headers

3. **Dashboard:**
   - Checks if user is authenticated
   - Displays user info in header
   - Embeds Grafana dashboard

## Files

- `app/api/auth/[...nextauth]/route.ts` - NextAuth configuration with credentials provider
- `app/api/grafana/[...path]/route.ts` - Proxy route with session validation
- `app/signin/page.tsx` - Custom sign-in page
- `app/dashboard/page.tsx` - Dashboard with embedded Grafana
- `app/page.tsx` - Home page with instructions

## Customization

### Add OAuth Providers

```typescript
// app/api/auth/[...nextauth]/route.ts
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // ... other providers
  ],
  // ... rest of config
}
```

### Add Database

Replace the in-memory `users` object with database queries:

```typescript
import { db } from '@/lib/db'

async function authorize(credentials) {
  const user = await db.user.findUnique({
    where: { email: credentials.email },
  })

  if (!user) return null

  const isValid = await bcrypt.compare(
    credentials.password,
    user.password
  )

  if (!isValid) return null

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }
}
```

### Role Mapping

Map your application roles to Grafana roles:

```typescript
const roleMap: Record<string, 'Admin' | 'Editor' | 'Viewer'> = {
  'super-admin': 'Admin',
  'admin': 'Editor',
  'user': 'Viewer',
}

const grafanaRole = roleMap[user.role] || 'Viewer'
```

## Security Notes

- **NEVER commit `.env` files**
- **Generate a strong `NEXTAUTH_SECRET`**
- **Use HTTPS in production**
- **Implement proper password hashing**
- **Use rate limiting on sign-in endpoint**
- **Validate all user inputs**
- **Review NextAuth security best practices**

## Troubleshooting

See the main [TROUBLESHOOTING.md](../../TROUBLESHOOTING.md) for common issues.

### NextAuth-specific Issues

**JWT errors:**
- Ensure `NEXTAUTH_SECRET` is set and consistent
- Check `NEXTAUTH_URL` matches your app URL

**Session not persisting:**
- Check browser cookies are enabled
- Verify cookie settings in NextAuth config
- Clear cookies and try again

**Sign-in failures:**
- Check credentials in `users` object
- Verify password comparison logic
- Enable debug logging in NextAuth
