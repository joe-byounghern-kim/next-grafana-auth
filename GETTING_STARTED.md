# Getting Started with next-grafana-auth

Choose the best way to get started with `next-grafana-auth` based on your needs:

---

## 🎯 Choose Your Path

| Goal | Recommended Path | Time Required | Difficulty |
|-------|-----------------|----------------|------------|
| **Quick evaluation** | Sandbox Environment | 5 minutes | ⭐ Easy |
| **Integration** | Basic Example | 15 minutes | ⭐ Easy |
| **Production** | NextAuth.js Example | 30 minutes | ⭐⭐ Medium |
| **Custom** | Custom Session Example | 45 minutes | ⭐⭐⭐ Hard |

---

## 🚀 Path 1: Quick Evaluation (Sandbox) ⭐

**Best for:** Testing the package before integrating, seeing it work immediately

**What you'll need:**
- Docker
- Node.js >= 18.18.0

**Setup:** 5 minutes (one command!)

```bash
cd sandbox
./quick-start.sh
```

**Then visit:** http://localhost:3000

**What you'll test:**
- ✅ Pre-configured Grafana dashboard
- ✅ Interactive testing console
- ✅ Auth-proxy headers
- ✅ Cookie forwarding
- ✅ Dashboard embedding

**Next:** [Sandbox README](./sandbox/README.md)

---

## 🧪 Path 2: Basic Integration ⭐

**Best for:** Integrating into existing project with minimal setup

**What you'll need:**
- Running Grafana instance (11.6+)
- Next.js 15+ project
- Node.js >= 18.18.0

**Setup:** 15 minutes (~55 lines of code)

**Step 1: Install package**
```bash
npm install next-grafana-auth
```

If the package is not published yet, install from a local tarball:

```bash
npm pack
npm install ./next-grafana-auth-1.0.0.tgz
```

**Step 2: Create proxy route**

Create `app/api/grafana/[...path]/route.ts`:

```typescript
import { handleGrafanaProxy } from 'next-grafana-auth'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session')?.value

  const user = await getUserFromSession(sessionId)

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const grafanaUrl = process.env.GRAFANA_INTERNAL_URL

  if (!grafanaUrl) {
    return Response.json({ error: 'Missing GRAFANA_INTERNAL_URL' }, { status: 500 })
  }

  return handleGrafanaProxy(request, {
    grafanaUrl,
    userEmail: user.email,
    userRole: user.role,
  }, (await params).path)
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH }
```

**Step 3: Embed dashboard**

Create `app/dashboard/page.tsx`:

```tsx
'use client'

import { GrafanaDashboard } from 'next-grafana-auth/component'

export default function DashboardPage() {
  return (
    <div style={{ height: '100vh' }}>
      <GrafanaDashboard
        baseUrl="/api/grafana"
        dashboardUid="your-dashboard-uid"
        dashboardSlug="your-dashboard-slug"
        params={{ kiosk: true, theme: 'dark' }}
      />
    </div>
  )
}
```

**Step 4: Configure environment**

Add to `.env`:
```bash
GRAFANA_INTERNAL_URL=http://localhost:3001
```

If Next.js runs on the host while Grafana runs in Docker, use:

```bash
GRAFANA_INTERNAL_URL=http://localhost:3001
```

**Step 5: Configure Grafana**

Add to Grafana config (`grafana.ini`):
```ini
[server]
root_url = %(protocol)s://%(domain)s:%(http_port)s/api/grafana
serve_from_sub_path = true  # Use true when serving Grafana under /api/grafana sub-path
allow_embedding = true

[auth.proxy]
enabled = true
header_name = X-WEBAUTH-USER
header_property = username
auto_sign_up = true
headers = Role:X-WEBAUTH-ROLE
enable_login_token = true  # Optional: enables Grafana login token/cookie flow
```

**That's it!** Visit `/dashboard` to see your embedded Grafana.

**Next:** [Basic Example](./examples/basic/README.md) | [Full Guide](./README.md)

---

## 🔐 Path 3: Production (NextAuth.js) ⭐⭐

**Best for:** Production app with OAuth providers (Google, GitHub, etc.)

**What you'll need:**
- Next.js 15+ project
- NextAuth.js configured
- Grafana instance

**Setup:** 30 minutes

**Step 1: Install dependencies**
```bash
npm install next-grafana-auth next-auth
```

**Step 2: Configure NextAuth.js**

Create `app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Verify credentials
        const user = await validateUser(credentials.email, credentials.password)
        if (!user) return null

        return {
          id: user.email,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      session.user.email = token.email
      session.user.role = token.role
      return session
    },
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
}
```

**Step 3: Create proxy route**

Create `app/api/grafana/[...path]/route.ts`:

```typescript
import { handleGrafanaProxy } from 'next-grafana-auth'
import { getServerSession } from 'next-auth'
import { NextRequest } from 'next/server'

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const grafanaUrl = process.env.GRAFANA_INTERNAL_URL

  if (!grafanaUrl) {
    return Response.json({ error: 'Missing GRAFANA_INTERNAL_URL' }, { status: 500 })
  }

  return handleGrafanaProxy(request, {
    grafanaUrl,
    userEmail: session.user.email,
    userRole: session.user.role,
  }, (await params).path)
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH }
```

**Step 4: Embed dashboard** (same as Path 2)

**Step 5: Configure environment**

```bash
GRAFANA_INTERNAL_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

If Next.js runs on the host while Grafana runs in Docker, use:

```bash
GRAFANA_INTERNAL_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

**Next:** [NextAuth.js Example](./examples/nextauth/README.md)

---

## 🛠️ Path 4: Custom Session ⭐⭐⭐

**Best for:** Production app with custom session management (OC-like)

**What you'll need:**
- Next.js 15+ project
- Database or Redis for sessions
- User authentication system
- Grafana instance

**Setup:** 45 minutes

**High-level steps:**
1. Create session management library (`app/lib/session.ts`)
2. Implement sign-in/sign-out endpoints (`app/api/auth/signin/route.ts`)
3. Create user info endpoint (`app/api/auth/user/route.ts`)
4. Create proxy route with session validation
5. Embed dashboard
6. Configure environment and Grafana

**Next:** [Custom Session Example](./examples/custom-session/README.md) - Full step-by-step guide

---

## 📋 Comparison of Paths

| Feature | Sandbox | Basic | NextAuth.js | Custom Session |
|----------|--------|--------|---------------|----------------|
| Setup Time | 5 min | 15 min | 30 min | 45 min |
| Code Required | 0 lines | ~55 lines | ~150 lines | ~300 lines |
| Grafana Setup | Pre-configured | Manual | Manual | Manual |
| Authentication | Demo | Custom | NextAuth.js | Custom |
| Session Storage | N/A | N/A (demo user) | JWT | Database/Redis |
| Production Ready | No | With changes | Yes | Yes |
| Learning Value | High | Medium | Medium | High |
| Recommended For | Evaluation | Quick integration | OAuth apps | Custom apps |

---

## 🎯 Decision Guide

### Choose Sandbox if:
- ✅ You want to test the package first
- ✅ You don't have Grafana set up yet
- ✅ You want to see it work immediately
- ✅ You're evaluating multiple options
- ⏱️ You have 5 minutes

### Choose Basic if:
- ✅ You have existing auth system
- ✅ You want minimal code changes
- ✅ You're integrating into existing project
- ✅ You want to understand how it works
- ⏱️ You have 15 minutes

### Choose NextAuth.js if:
- ✅ You need OAuth (Google, GitHub)
- ✅ You want battle-tested auth
- ✅ You're starting a new project
- ✅ You don't want custom auth logic
- ⏱️ You have 30 minutes

### Choose Custom Session if:
- ✅ You have existing session system
- ✅ You need full control
- ✅ You're migrating from legacy system
- ✅ You want production-ready patterns
- ⏱️ You have 45 minutes

---

## 🔄 Migration Guide

### From Sandbox to Production

1. ✅ Complete sandbox testing checklist
2. ✅ Verify package works for your use case
3. ✅ Choose Basic, NextAuth.js, or Custom Session path
4. ✅ Integrate into your project
5. ✅ Test with your own Grafana instance
6. ✅ Test with your own dashboards
7. ✅ Test with real users
8. ✅ Deploy to staging
9. ✅ Monitor logs and performance
10. ✅ Deploy to production

### From Basic to Production

1. ✅ Replace demo user with real auth
2. ✅ Add session validation
3. ✅ Add error handling
4. ✅ Add logging
5. ✅ Test with multiple users
6. ✅ Add role-based access
7. ✅ Deploy to staging
8. ✅ Deploy to production

---

## 📚 Additional Resources

### Documentation
- [README.md](./README.md) - Full documentation
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues
- [CHANGELOG.md](./CHANGELOG.md) - Version history

### Examples
- [Sandbox](./sandbox/README.md) - Quick evaluation
- [Basic](./examples/basic/README.md) - Minimal integration
- [NextAuth.js](./examples/nextauth/README.md) - OAuth integration
- [Custom Session](./examples/custom-session/README.md) - Production patterns

### Testing
- [Sandbox](./sandbox/) - Interactive testing
- [TESTING_CHECKLIST](./sandbox/TESTING_CHECKLIST.md) - Complete checklist

---

## ❓ Need Help?

### Choose the right resource:

**I want to evaluate the package:**
→ Go to [Sandbox](./sandbox/README.md)

**I want to integrate quickly:**
→ Go to [Basic Example](./examples/basic/README.md)

**I need OAuth providers:**
→ Go to [NextAuth.js Example](./examples/nextauth/README.md)

**I have custom auth system:**
→ Go to [Custom Session Example](./examples/custom-session/README.md)

**Something isn't working:**
→ Go to [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

**I found a bug:**
→ [Open GitHub Issue](https://github.com/joe-byounghern-kim/nextjs-proxied-grafana-embedding/issues)

---

## ✅ Success Checklist

After getting started, verify:

- [ ] Package installed successfully
- [ ] Proxy route created (`/api/grafana/[...path]/route.ts`)
- [ ] Dashboard page created (`/dashboard/page.tsx`)
- [ ] Environment configured (`GRAFANA_INTERNAL_URL`)
- [ ] Grafana configured (auth-proxy, sub-path)
- [ ] Dashboard loads in browser
- [ ] Charts display correctly
- [ ] No auth errors in console
- [ ] Server logs show headers

---

**Last Updated:** 2026-02-16
**Version:** 1.0.0
