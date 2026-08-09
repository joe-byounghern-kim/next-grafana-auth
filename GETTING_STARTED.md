# Getting Started

## Prerequisites

- Node.js `>=18.18.0`
- Next.js `>=15.0.0`
- React `>=18.0.0`
- Grafana `>=11.6`

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

Keep the route path, `pathPrefix`, component `baseUrl`, and Grafana sub-path aligned:

```ini
[server]
root_url = %(protocol)s://%(domain)s:%(http_port)s/api/grafana
serve_from_sub_path = true

[auth.proxy]
enabled = true
header_name = X-WEBAUTH-USER
header_property = username
headers = Role:X-WEBAUTH-ROLE
enable_login_token = true
```

## 5. Verify the integration

Run the checks from an authenticated application session. Each command must exit successfully.

```bash
set -euo pipefail
docker compose -f examples/docker-compose.yml config --quiet
GRAFANA_BASE_URL=http://localhost:3001/api/grafana scripts/verify-grafana.sh
curl -fsS http://localhost:3000/api/grafana/api/health >/dev/null
curl -fsS http://localhost:3000/dashboard >/dev/null
```

The Grafana verifier checks health, the provisioned datasource and dashboard, and a TestData query. The final two commands are binary proxy health and dashboard render checks.

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
