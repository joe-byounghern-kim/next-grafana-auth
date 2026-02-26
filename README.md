# next-grafana-auth

[![license](https://img.shields.io/npm/l/next-grafana-auth)](https://github.com/joe-byounghern-kim/next-grafana-auth/blob/main/LICENSE)

Embed Grafana dashboards in Next.js with auth-proxy authentication. Zero dependencies, full TypeScript support, and works with Next.js 15+.

---

## ✨ Highlights

- 🎉 **Sandbox Environment** - Test the package in 5 minutes with pre-configured Grafana
- 📖 **Comprehensive Examples** - Basic, NextAuth.js, and Custom Session implementations
- 🔧 **Interactive Testing** - Browser console with automated tests
- 📋 **Complete Documentation** - GETTING_STARTED.md, TROUBLESHOOTING.md, and 3 example READMEs

**Quick Test:** → [Try Sandbox](#-sandbox-quick-evaluation)

---

## 🚀 Quick Start Options

| Goal | Time | Path |
|-------|-------|-------|
| **Test in 5 minutes** | 5 min | [⚡ Try Sandbox](#-sandbox-quick-evaluation) |
| **Quick integration** | 15 min | [📦 Install Package](#installation) |
| **Production setup** | 30 min | [🔐 Examples](#examples) |

**New to the package?** → Start with [Sandbox](sandbox/README.md) to test it immediately!

**See all options** → [GETTING_STARTED.md](./GETTING_STARTED.md)

---

## 📑 Table of Contents

- [📊 Features](#-features)
- [📥 Installation](#installation)
- [⚠️ Default Recommended Configuration](#-default-recommended-configuration)
  - [1. Next.js Route Path](#1-nextjs-route-path)
  - [2. Docker Networking](#2-docker-networking)
  - [3. Grafana Configuration](#3-grafana-configuration)
- [⚡ Sandbox: Quick Evaluation](#-sandbox-quick-evaluation)
- [🚀 Quick Start](#quick-start)
- [📚 API Reference](#api-reference)
  - [`handleGrafanaProxy()`](#handlegrafanaproxy)
  - [`<GrafanaDashboard />`](#grafanadashboard-)
- [⚙️ Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Docker Setup](#docker-setup)
- [📂 Examples](#examples)
- [🔧 Troubleshooting](#troubleshooting)
- [📋 Requirements](#requirements)
- [🔒 Security](#security)
- [📄 License](#license)



## 📊 Features

| Feature | Description |
|---------|-------------|
| **Zero Runtime Dependencies** | Only relies on Next.js and React (peer dependencies) |
| **Full TypeScript Support** | 100% typed, no `any` types |
| **Next.js 15+ Compatible** | Uses `await cookies()` and `await params` |
| **Simple API** | ~55 lines of user code for full integration |
| **Flexible Authentication** | Works with any auth system (NextAuth, Clerk, custom sessions) |
| **Grafana 11.6+ Ready** | Tested with latest Grafana auth-proxy APIs |
| **Bundle Size** | <15KB minified (8.3KB actual) |
| **Sandbox Testing** | Pre-configured environment for quick evaluation |

### Why This Package?

- ✅ **Easy Integration** - Add proxy route and dashboard page in minutes
- ✅ **Production Ready** - Handles cookies, headers, and errors properly
- ✅ **Flexible Auth** - Bring your own authentication system
- ✅ **Type-Safe** - Full TypeScript support with IntelliSense
- ✅ **Well-Tested** - Comprehensive examples and sandbox environment
- ✅ **Zero Dependencies** - No bloat, just what you need

## Installation

```bash
npm install next-grafana-auth
```

If the package is not published yet, use a local tarball for evaluation:

```bash
npm pack
npm install ./next-grafana-auth-1.0.0.tgz
```

## ⚠️ Default Recommended Configuration

Before using this package, you should configure the following defaults unless your deployment intentionally uses a different sub-path.

### 1. Next.js Route Path

Use `/api/grafana/[...path]/route.ts` as the default route location:

❌ **Wrong:** `/api/dashboard/[...path]/route.ts`
✅ **Correct:** `/api/grafana/[...path]/route.ts`

This default works with the package default `pathPrefix` (`/api/grafana`) and common Grafana sub-path setups. If you change the route path, keep Grafana `root_url` and `pathPrefix` aligned.

### 2. Docker Networking

Set `GRAFANA_INTERNAL_URL` based on where your Next.js server runs:

```yaml
# Host-run Next.js + Docker Grafana
GRAFANA_INTERNAL_URL=http://localhost:3001

# Next.js running inside Docker on the same network
GRAFANA_INTERNAL_URL=http://grafana:3000
```

### 3. Grafana Configuration

Add this to your Grafana configuration (typically `/etc/grafana/grafana.ini`):

```ini
[server]
root_url = %(protocol)s://%(domain)s:%(http_port)s/api/grafana
serve_from_sub_path = true
allow_embedding = true

[auth.proxy]
enabled = true
header_name = X-WEBAUTH-USER
header_property = username
auto_sign_up = true
headers = Role:X-WEBAUTH-ROLE
enable_login_token = true  # Recommended when you want Grafana login token/cookie behavior

[security]
allow_embedding = true
cookie_samesite = none
cookie_secure = true

[auth]
disable_login_form = true
```

---

## ⚡ Sandbox: Quick Evaluation (5 Minutes)

**Don't have Grafana configured yet?** Try the sandbox to test `next-grafana-auth` immediately!

### What is the Sandbox?

A self-contained testing environment with:
- ✅ Pre-configured Grafana Docker container
- ✅ Pre-built Next.js app with demo dashboard
- ✅ Interactive testing console
- ✅ One-command setup

### Quick Start

```bash
# Clone and enter sandbox
git clone https://github.com/joe-byounghern-kim/next-grafana-auth.git
cd next-grafana-auth/sandbox

# Run the quick-start script
./quick-start.sh
```

**That's it!** The script will:
1. Start Grafana Docker container (pre-configured)
2. Install Node.js dependencies
3. Set up environment variables
4. Start Next.js development server
5. Print access URL (`http://localhost:3000`) for manual open

### What to Test

1. **Home Page** - Click "Run Tests" to verify setup
2. **Dashboard Page** - See embedded Grafana with charts
3. **Console Logs** - Check auth-proxy headers are being sent

**Complete testing checklist:** [sandbox/README.md](sandbox/README.md) (includes setup and validation checks)

### Full Documentation

[📖 Sandbox README](sandbox/README.md) - Complete guide with troubleshooting

---

## Quick Start

### Step 1: Create the proxy route

Create `app/api/grafana/[...path]/route.ts`:

```typescript
import { handleGrafanaProxy } from 'next-grafana-auth'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

// Your auth logic - adapt this to your auth system
async function getUserFromSession(sessionId: string | undefined) {
  if (!sessionId) return null

  // Example: Fetch from your backend
  // const response = await fetch('https://your-api.com/user', {
  //   headers: { Authorization: `Bearer ${sessionId}` },
  // })
  // const user = await response.json()
  // return { email: user.email, role: user.role }

  // Example: NextAuth.js
  // const session = await getServerSession(authOptions)
  // return { email: session.user.email, role: session.user.role }

  // Example: Custom session
  // const user = await db.session.findUnique({ where: { id: sessionId } })
  // return { email: user.email, role: user.role }

  return { email: 'user@example.com', role: 'Viewer' }
}

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

### Step 2: Embed the dashboard

Create `app/dashboard/page.tsx`:

```tsx
'use client'

import { GrafanaDashboard } from 'next-grafana-auth/component'

export default function DashboardPage() {
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <GrafanaDashboard
        baseUrl="/api/grafana"
        dashboardUid="your-dashboard-uid"
        dashboardSlug="your-dashboard-slug"
        params={{
          kiosk: true,
          theme: 'dark',
          from: 'now-1h',
          to: 'now',
        }}
      />
    </div>
  )
}
```

### Step 3: Set environment variables

Add to your `.env`:

```bash
GRAFANA_INTERNAL_URL=http://localhost:3001

# If Next.js also runs inside Docker on the same network:
# GRAFANA_INTERNAL_URL=http://grafana:3000
```

**That's it!** You now have Grafana dashboards embedded in your Next.js app with authentication.

> 💡 **Tip:** If you don't have Grafana configured yet, try the [Sandbox](#-sandbox-quick-evaluation) to test the package in 5 minutes!

> 📚 **More Options:** See [GETTING_STARTED.md](./GETTING_STARTED.md) for multiple integration paths (Sandbox, Basic, NextAuth.js, Custom Session).

## API Reference

### `handleGrafanaProxy()`

Core proxy handler for forwarding requests to Grafana with auth-proxy headers.

**Signature:**
```typescript
function handleGrafanaProxy(
  request: Request,
  config: GrafanaProxyConfig,
  pathParams?: string[]
): Promise<Response>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `request` | `Request` | Yes | Web Request object (NextRequest-compatible) |
| `config` | `GrafanaProxyConfig` | Yes | Proxy configuration |
| `pathParams` | `string[]` | No | Path array from `[...path]` catch-all route |

**GrafanaProxyConfig:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `grafanaUrl` | `string` | Yes | - | Grafana server URL (e.g., `http://grafana:3000`) |
| `userEmail` | `string` | Yes | - | User's email address |
| `userRole` | `'Admin' \| 'Editor' \| 'Viewer'` | Yes | - | User's Grafana role |
| `pathPrefix` | `string` | No | `'/api/grafana'` | Path prefix for proxy route |
| `requestTimeoutMs` | `number` | No | `10000` | Timeout for upstream Grafana request in milliseconds |
| `forwardRequestHeaders` | `string[]` | No | `[]` | Additional safe request headers to forward |

### `<GrafanaDashboard />`

React component for embedding Grafana dashboards.

**Props:**

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `baseUrl` | `string` | Yes | - | Proxy base URL (usually `/api/grafana`) |
| `dashboardUid` | `string` | Yes | - | Dashboard UID from Grafana |
| `dashboardSlug` | `string` | No | `'dashboard'` | Dashboard slug (for cleaner URLs) |
| `params` | `GrafanaUrlParams` | No | `{}` | URL parameters for dashboard |
| `showLoading` | `boolean` | No | `true` | Show loading overlay |
| `minLoadingTime` | `number` | No | `1500` | Min time to show spinner (ms) |
| `renderBuffer` | `number` | No | `500` | Buffer time after onLoad (ms) |
| `fallbackTimeoutMs` | `number` | No | `10000` | Timeout before showing fallback loading error state |
| `loadingMessage` | `string` | No | `'Loading dashboard...'` | Accessible loading status text |
| `timeoutMessage` | `string` | No | `'Dashboard is taking longer than expected to load.'` | Message shown when fallback timeout is reached |
| `errorMessage` | `string` | No | `'Failed to load dashboard. Please try again.'` | Message shown when iframe reports an error |
| `title` | `string` | No | `'Grafana Dashboard'` | Accessible iframe title |
| `showRetryButton` | `boolean` | No | `true` | Show retry action when timeout/error state is displayed |
| `retryButtonText` | `string` | No | `'Retry'` | Retry button label |
| `onRetry` | `(context: { attempt: number; reason: 'timeout' &#124; 'error' }) => void` | No | - | Callback fired when user triggers retry |
| `className` | `string` | No | - | CSS class name |
| `style` | `React.CSSProperties` | No | - | Inline styles |

**GrafanaUrlParams:**

| Property | Type | Description |
|----------|------|-------------|
| `kiosk` | `boolean &#124; 'tv'` | Enable kiosk mode (hides UI) |
| `theme` | `'light' &#124; 'dark'` | Dashboard theme |
| `refresh` | `string` | Auto-refresh interval (e.g., `'5s'`, `'1m'`) |
| `from` | `string` | Time range start (e.g., `'now-1h'`) |
| `to` | `string` | Time range end (e.g., `'now'`) |
| `orgId` | `number` | Organization ID |
| `authToken` | `string` | JWT authentication token |
| `variables` | `Record<string, string &#124; string[]>` | Template variables |

## Configuration

### Environment Variables

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `GRAFANA_INTERNAL_URL` | Yes | `http://localhost:3001` | Internal Grafana URL for server-to-server communication |

### Docker Setup

Add Grafana to your `docker-compose.yml`:

```yaml
services:
  grafana:
    image: grafana/grafana:11.6.5
    ports:
      - "3001:3000"
    environment:
      - GF_SERVER_ROOT_URL=%(protocol)s://%(domain)s:%(http_port)s/api/grafana
      - GF_SERVER_SERVE_FROM_SUB_PATH=true
      - GF_SECURITY_ALLOW_EMBEDDING=true
      - GF_AUTH_PROXY_ENABLED=true
      - GF_AUTH_PROXY_HEADER_NAME=X-WEBAUTH-USER
      - GF_AUTH_PROXY_HEADER_PROPERTY=username
      - GF_AUTH_PROXY_ENABLE_LOGIN_TOKEN=true
    volumes:
      - ./grafana.ini:/etc/grafana/grafana.ini
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

## Examples

Choose the best example for your needs:

| Example | Time | Difficulty | Best For |
|---------|------|------------|----------|
| [⚡ Sandbox](sandbox/README.md) | 5 min | ⭐ Easy | Quick evaluation, no setup |
| [📦 Basic](examples/basic/README.md) | 15 min | ⭐ Easy | Quick integration into existing project |
| [🔐 NextAuth.js](examples/nextauth/README.md) | 30 min | ⭐⭐ Medium | OAuth providers (Google, GitHub, etc.) |
| [🛠️ Custom Session](examples/custom-session/README.md) | 45 min | ⭐⭐⭐ Hard | Production patterns, custom auth |

### Sandbox (Recommended for First-Time Users)

**Quickly test the package** without any Grafana setup:

```bash
cd sandbox
./quick-start.sh
```

- ✅ Pre-configured Grafana Docker container
- ✅ Interactive testing console
- ✅ Complete documentation
- ✅ One-command setup

[📖 Sandbox README](sandbox/README.md)

### Basic Example

Minimal session auth (~55 lines of user code):

```bash
cd examples/basic
npm ci
npm run dev
```

### NextAuth.js Example

Complete NextAuth.js integration with OAuth:

```bash
cd examples/nextauth
npm ci
npm run dev
```

### Custom Session Example

Production-ready patterns (OC-like):

```bash
cd examples/custom-session
npm ci
npm run dev
```

> 💡 **Tip:** See [GETTING_STARTED.md](./GETTING_STARTED.md) for detailed path comparison and decision guide.

## Troubleshooting

**New to the package?** Try the [Sandbox](#-sandbox-quick-evaluation) to test it in 5 minutes without setup!

**Still having issues?** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for:

- Common issues and solutions
- Debugging checklist
- Error message explanations
- Network/DNS problems
- Grafana configuration issues

## Requirements

- **Node.js:** >=18.18.0
- **Next.js:** >=15.0.0 (requires async cookies and Promise params)
- **React:** >=18.0.0
- **Grafana:** 11.6+ (auth-proxy stable in this version)

## Security

This package uses Grafana's built-in auth-proxy authentication:

- User credentials never leave your server
- No JWT server required
- Session-based auth handled by your app
- Secure-by-default proxy header forwarding and cookie handling

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Support

| Need Help? | Resource |
|------------|----------|
| **Quick Test** | [⚡ Sandbox](sandbox/README.md) - Test in 5 minutes |
| **Getting Started** | [📖 GETTING_STARTED.md](./GETTING_STARTED.md) - Choose your path |
| **Troubleshooting** | [🔧 TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues |
| **GitHub Issues** | [Issues](https://github.com/joe-byounghern-kim/next-grafana-auth/issues) - Report bugs |

**Documentation:**
- [README.md](./README.md) - Full package documentation
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Debugging guide
- [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) - Pre-release and post-release checks
- [GETTING_STARTED.md](./GETTING_STARTED.md) - Integration paths
- [SUPPORT.md](./SUPPORT.md) - Support scope and expectations
- [SECURITY.md](./SECURITY.md) - Vulnerability disclosure policy

## Contributing

Contributions are welcome.

- Start with [CONTRIBUTING.md](./CONTRIBUTING.md)
- Follow [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- For security issues, follow [SECURITY.md](./SECURITY.md)

## Changelog

This is the initial release (v1.0.0). Future changes will be documented in GitHub Releases.
