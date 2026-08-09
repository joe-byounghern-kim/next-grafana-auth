# next-grafana-auth

Embed Grafana dashboards in Next.js through a server-side Grafana auth-proxy route. Runtime dependencies remain zero; Next.js, React, and ReactDOM are peer dependencies.

## Why use it

`handleGrafanaProxy()` keeps Grafana behind your server and adds trusted auth-proxy identity headers. `GrafanaDashboard` renders the resulting dashboard URL in a client component with loading, timeout, error, and retry states.

## Install

```bash
npm install next-grafana-auth
```

## Minimal proxy route

Derive identity from your server-side auth or session system. Do not read identity from browser-supplied headers.

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

## Minimal dashboard component

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

## Critical security and path invariants

- Keep the catch-all route path, `pathPrefix`, iframe `baseUrl`, and Grafana `root_url` aligned. The default proxy prefix is `/api/grafana`.
- Set `GRAFANA_INTERNAL_URL` to a URL reachable from the Next.js server. The topology-specific values are in the integration workflow.
- Derive `userEmail` and `userRole` on the server and map roles only to `Admin`, `Editor`, or `Viewer`.
- **Security warning:** never trust inbound `X-WEBAUTH-*`, `Authorization`, or `Cookie` headers. The proxy replaces identity headers with server-derived values and never forwards inbound authorization or cookie headers to Grafana.
- URL `authToken` values are visible in browser history, access logs, and referrers; prefer the session-cookie auth-proxy flow.
- In production, configure Grafana auth-proxy `whitelist` for trusted proxy egress CIDRs or IPs.

## Compatibility

| Compatibility category | Supported versions |
|---|---|
| Published consumer floors | Node.js `>=18.18.0`, Next.js `>=15.0.0`, React `>=18.0.0`, Grafana `>=11.6` |
| Current repository examples | Next.js `16.3.0`, React `19.2.8`, Grafana `13.1.3` |

The current repository example versions are not the published consumer support floors.

## Documentation

- [Getting Started](./GETTING_STARTED.md)
- [API Reference](./docs/API_REFERENCE.md)
- [Examples](./examples/README.md)
- [Sandbox](./sandbox/README.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Security policy](./SECURITY.md)
- [Support policy](./SUPPORT.md)
- [Optional installable skill](./.agents/skills/next-grafana-auth/SKILL.md): `npx skills add joe-byounghern-kim/next-grafana-auth`

## License

MIT License. See [LICENSE](./LICENSE).
