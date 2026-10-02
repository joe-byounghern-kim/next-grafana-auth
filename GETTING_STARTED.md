# Getting Started

## Prerequisites

- Node.js `>=18.18.0`
- Next.js `>=15.0.0`
- React `>=18.0.0`
- Grafana `>=11.6`

Use supported, patched versions that meet these compatibility floors. These are consumer requirements, not the repository build toolchain. To run this repository's examples, follow [Examples](./examples/README.md).

## 1. Install the package

```bash
npm install next-grafana-auth
```

## 2. Create the catch-all proxy route

Create `app/api/grafana/[...path]/route.ts`. Resolve identity from your server-side auth or session system, reject missing sessions, and pass the async route parameter path to the proxy.

```typescript
import { handleGrafanaProxy } from 'next-grafana-auth'
import type { NextRequest } from 'next/server'

type GrafanaUser = {
  email: string
  role: 'Admin' | 'Editor' | 'Viewer'
}

// Replace this declaration with your server-side session lookup.
declare function getAuthenticatedUser(): Promise<GrafanaUser | null>

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const grafanaUrl = process.env.GRAFANA_INTERNAL_URL
  if (!grafanaUrl) {
    return Response.json({ error: 'Missing GRAFANA_INTERNAL_URL' }, { status: 500 })
  }

  return handleGrafanaProxy(
    request,
    { grafanaUrl, userEmail: user.email, userRole: user.role },
    (await params).path
  )
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH }
```

Do not derive identity from request headers. The proxy creates trusted upstream identity headers from the server-derived `userEmail` and `userRole`.

## 3. Render the dashboard

```tsx
'use client'

import { GrafanaDashboard } from 'next-grafana-auth/component'

export default function DashboardPage() {
  return (
    <div style={{ height: '100vh' }}>
      <GrafanaDashboard baseUrl="/api/grafana" dashboardUid="your-dashboard-uid" />
    </div>
  )
}
```

## 4. Configure Grafana auth-proxy and sub-path

Set `GRAFANA_INTERNAL_URL` according to where the Next.js server runs:

| Topology | Value |
|---|---|
| Host-run Next.js with Docker Grafana | `GRAFANA_INTERNAL_URL=http://localhost:3001` |
| Next.js and Grafana on the same Docker network | `GRAFANA_INTERNAL_URL=http://grafana:3000` |

Keep the route path, `pathPrefix`, component `baseUrl`, and Grafana sub-path aligned. For production, set `root_url` to the public application URL and proxy path, for example `https://app.example.com/api/grafana/`, not the private Grafana address:

```ini
[server]
root_url = https://app.example.com/api/grafana/
serve_from_sub_path = true

[security]
allow_embedding = true

[auth.proxy]
enabled = true
header_name = X-WEBAUTH-USER
header_property = username
headers = Role:X-WEBAUTH-ROLE
enable_login_token = true
```

Configure HTTPS and an auth-proxy `whitelist` restricted to trusted proxy egress IPs or CIDRs. Keep Grafana private. The [local Compose stack](./examples/grafana/README.md) uses development-only URL and cookie settings, not this production URL.

For a custom proxy path such as `/observability`, use `app/observability/[...path]/route.ts`, pass `pathPrefix: '/observability'` to `handleGrafanaProxy`, set the component `baseUrl` to `/observability`, and configure Grafana `root_url` with that same public sub-path.

## 5. Verify the integration

In the browser, sign in to your application and request `/api/grafana/api/health`. Then request `/api/grafana/api/user` and confirm the Grafana identity matches the server-side session (`login` matches the session email when `header_property = username`, as configured above). Health only proves reachability, not identity or role authorization.

Open the dashboard page and confirm the iframe shows the intended dashboard and panels through the proxy without a Grafana login prompt. A successful page HTTP response or iframe load event alone does not prove Grafana rendered. In a separate signed-out browser session, confirm the proxy rejects requests with `401` (or your application's documented unauthorized response).

For this repository's local stack only, start Grafana using its [stack guide](./examples/grafana/README.md), then run from the repository root:

```bash
set -euo pipefail
docker compose -f examples/docker-compose.yml config --quiet
GRAFANA_BASE_URL=http://localhost:3001/api/grafana scripts/verify-grafana.sh
```

The verifier uses local demo headers to check Grafana health, the provisioned datasource and dashboard, and a TestData query. It does not validate your application's session or browser rendering. `curl` does not inherit a browser session. If using it to test an authenticated application, supply that application's test-session credentials locally and never include them in logs or issue reports.

## Choose an authentication example

| Example | Use when | Guide |
|---|---|---|
| Basic | You need the smallest proxy and dashboard flow | [Basic](./examples/basic/README.md) |
| NextAuth | Your app uses NextAuth session primitives | [NextAuth](./examples/nextauth/README.md) |
| Custom Session | Your app owns session storage and validation | [Custom Session](./examples/custom-session/README.md) |
| Sandbox | You want a fast local evaluation | [Sandbox](./sandbox/README.md) |

## Next steps

- Read the [API Reference](./docs/API_REFERENCE.md) for complete exports and options.
- Use the [canonical Grafana guide](./examples/grafana/README.md) for the shared local stack.
- Use [Troubleshooting](./TROUBLESHOOTING.md) when the first check fails.
