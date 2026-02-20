# next-grafana-auth Sandbox

**A self-contained testing environment for evaluating `next-grafana-auth` package.**

This sandbox allows anyone to test the package on their device with minimal setup - **no Grafana configuration required!**

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- **Docker** - For running Grafana
- **Node.js** >= 18.18.0 - For running Next.js
- **Git** - For cloning the repo

### One-Line Setup

```bash
# Clone the repository
git clone https://github.com/joe-byounghern-kim/next-grafana-auth.git
cd next-grafana-auth/sandbox

# Run quick-start script
./quick-start.sh
```

That's it! The script will:
1. ✅ Reset Grafana volume for deterministic demo state
2. ✅ Start Grafana Docker container (pre-configured)
3. ✅ Verify TestData datasource + demo dashboard + query response
4. ✅ Install Node.js dependencies
5. ✅ Set up environment variables
6. ✅ Start Next.js development server
7. ✅ Print access URL (`http://localhost:3000`) for manual open

To keep existing Grafana data between runs:

```bash
KEEP_GRAFANA_DATA=1 ./quick-start.sh
```

---

## 🧪 Testing Guide

Once the sandbox is running, visit `http://localhost:3000` to access:

### 1. Home Page (Testing Console)
- **Click "Run Tests"** to verify the setup
- Tests check:
  - Grafana health
  - Proxy endpoint
  - Auth-proxy configuration
- View real-time test results in console

### 2. Dashboard Page (Embedded Grafana)
- **Click "View Dashboard"** or visit `/dashboard`
- Verify:
  - Dashboard loads in iframe
  - Charts display data
  - Kiosk mode active (no Grafana UI)
  - Dark theme applied
  - Time range selector works
  - Refresh interval works
  - No auth errors in browser console

### 3. Server Logs
- Check Next.js terminal for:
  - `Proxying to Grafana` with `userEmail` and `targetUrl` - identity and proxy forwarding
- Check Grafana logs:
  ```bash
  docker compose logs -f grafana
  ```

---

## 📋 Manual Setup

If you prefer manual setup instead of the quick-start script:

### 1. Start Grafana

```bash
cd sandbox
docker compose down -v
docker compose up -d
```

Wait for Grafana to start (check with `docker compose ps`).

### 2. Install Dependencies

```bash
cd sandbox
npm ci
```

### 3. Set Up Environment

Create `.env` file:

```bash
GRAFANA_INTERNAL_URL=http://localhost:3001
```

### 4. Start Next.js

```bash
npm run dev
```

### 5. Visit

- Home: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard

---

## 🗂️ Sandbox Structure

```
sandbox/
├── app/
│   ├── api/grafana/[...path]/route.ts  # Proxy handler
│   ├── dashboard/page.tsx              # Embedded dashboard
│   ├── page.tsx                       # Home with testing console
│   ├── layout.tsx                     # Root layout
│   └── globals.css                    # Styles
├── package.json                       # Dependencies
├── docker-compose.yml                  # Grafana container
├── provisioning/                      # Grafana datasource/dashboard provisioning
├── quick-start.sh                    # Automation script
├── .env                             # Environment variables (auto-created)
└── README.md                         # This file
```

---

## 🐛 Troubleshooting

### Grafana Won't Start

**Symptoms:** `docker compose up` fails or Grafana not healthy

**Solutions:**
```bash
# Check port 3001 is available
lsof -i :3001

# Check Grafana logs
docker compose logs grafana

# Restart Grafana
docker compose restart grafana
```

### Dashboard Shows Blank/White Screen

**Symptoms:** iframe loads but shows blank page

**Solutions:**
```bash
# Check Grafana is running
docker compose ps

# Check Grafana health endpoint
curl http://localhost:3001/api/health

# Verify proxy route exists
curl http://localhost:3000/api/grafana/api/health

# Check browser console for errors
# Look for CORS, mixed content, or auth errors
```

### 401 Unauthorized Error

**Symptoms:** Dashboard shows "Unauthorized"

**Solutions:**
1. Check Next.js logs for auth-proxy headers
2. Verify `GRAFANA_INTERNAL_URL` in `.env`
3. Check Grafana auth-proxy configuration
4. Ensure demo user email is valid (`demo@example.com`)

### Proxy Returns 404

**Symptoms:** `/api/grafana/...` returns 404

**Solutions:**
1. Verify route path and proxy prefix alignment (default: `/api/grafana/[...path]/route.ts`)
2. Check Next.js is using App Router
3. Restart Next.js: `npm run dev`

### Port Already in Use

**Symptoms:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or map a different host port (example: 3002:3000)
# then restart docker compose
```

---

## 🧹 Cleanup

### Stop Everything

```bash
# Stop containers
docker compose down

# Stop Next.js (Ctrl+C in terminal)
```

### Remove All Data

```bash
# Stop containers and remove volumes
docker compose down -v

# Remove node_modules
rm -rf node_modules
```

### Fresh Start

```bash
# Complete cleanup
docker compose down -v
rm -rf node_modules .env

# Re-run quick-start
./quick-start.sh
```

---

## 📊 Sandbox Configuration

### Grafana (Docker)
- **Image:** `grafana/grafana:11.6.5`
- **Port:** `3001` (host) → `3000` (container)
- **Network:** `sandbox-network` (bridge)
- **Auth-proxy:** Enabled with demo user
- **Dashboard UID:** `demo-dashboard` (provisioned at startup with 5 panels using TestData mock data)
- **Data Volume:** `grafana-sandbox-data`

### Next.js
- **Framework:** Next.js 15+
- **Auth System:** Demo (no real auth)
- **User:** `demo@example.com` (Viewer role)
- **Proxy Route:** `/api/grafana/[...path]/route.ts`
- **Dashboard Route:** `/dashboard`

### Demo User
```javascript
{
  email: 'demo@example.com',
  role: 'Viewer'
}
```

---

## 🔧 Customization

### Use Your Own Dashboard

1. Access Grafana directly:
   ```
   http://localhost:3001/api/grafana
   ```

2. Create a new dashboard (or export existing one)

3. Get the Dashboard UID:
   - Click "Share" → "Link" → Copy UID from URL
   - Or check Dashboard Settings

4. Update `sandbox/app/dashboard/page.tsx`:
   ```tsx
   <GrafanaDashboard
     baseUrl="/api/grafana"
     dashboardUid="your-dashboard-uid"  // Change this!
     dashboardSlug="your-dashboard-slug"  // Change this!
     params={{ kiosk: true, theme: 'dark' }}
   />
   ```

### Add Real Authentication

Replace the demo user in `sandbox/app/api/grafana/[...path]/route.ts`:

```typescript
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

async function getUserFromSession(sessionId: string | undefined) {
  // Your auth logic here
  // - NextAuth.js
  // - Clerk
  // - Custom session
  // - JWT verification

  return { email: 'user@example.com', role: 'Viewer' }
}

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session')?.value

  const user = await getUserFromSession(sessionId)

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
```

See the main `examples/` directory for complete auth implementations.

---

## 📝 Testing Checklist

Before reporting an issue, verify these items:

- [ ] Grafana container is running (`docker compose ps`)
- [ ] Grafana is healthy (green status in `docker compose ps`)
- [ ] Next.js dev server is running (no errors in terminal)
- [ ] Can access http://localhost:3000
- [ ] Can access http://localhost:3000/api/grafana/api/health
- [ ] Dashboard loads (not blank)
- [ ] Charts display data
- [ ] No CORS errors in browser console
- [ ] No auth errors in browser console
- [ ] Server logs show `Proxying to Grafana` with `userEmail`
- [ ] Grafana logs show incoming requests

---

## 🎯 What This Sandbox Tests

This sandbox verifies the following `next-grafana-auth` features:

| Feature | How to Test |
|----------|--------------|
| **Proxy Handler** | Check server logs for `Proxying to Grafana` |
| **Auth-Proxy Headers** | Check server logs for `Proxying to Grafana` with `userEmail` |
| **Cookie Forwarding** | Check browser DevTools > Network > Set-Cookie |
| **Dashboard Embedding** | Visit `/dashboard` - dashboard should load |
| **Kiosk Mode** | Dashboard should have no Grafana UI |
| **Dark Theme** | Dashboard should be dark |
| **URL Parameters** | Time range and refresh should work |
| **Loading States** | Spinner should appear and disappear |
| **Error Handling** | Try invalid URL - should show error page |

---

## 📚 Related Documentation

- [Main README](../README.md) - Package documentation
- [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) - Common issues
- [Examples](../examples/) - Working implementations
- [RELEASE_CHECKLIST.md](../RELEASE_CHECKLIST.md) - Release process

---

## 🤝 Contributing

Found a bug or have a suggestion?

1. Verify the bug in the sandbox
2. Check TROUBLESHOOTING.md
3. Search existing GitHub issues
4. Create a new issue with:
   - Sandbox version
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser console errors
   - Server terminal logs

---

## ⚠️ Limitations

This sandbox is for **testing and evaluation only**:

- ❌ No real authentication (demo user)
- ❌ No database (in-memory data)
- ❌ No production configuration
- ❌ No security hardening
- ❌ Not suitable for production use

For production examples, see the `examples/` directory.

---

## 🎉 Success Criteria

If the sandbox is working correctly, you should see:

1. ✅ Grafana container is healthy
2. ✅ All tests pass in browser console
3. ✅ Dashboard loads at `/dashboard`
4. ✅ Charts display with data
5. ✅ No errors in browser console
6. ✅ No errors in server terminal
7. ✅ Auth-proxy headers in server logs

**If all checks pass, `next-grafana-auth` is working correctly!** 🎊

---

**Last Updated:** 2026-02-16
**Sandbox Version:** 1.0.0
