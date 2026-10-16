# Copyable integration templates

Check the installed package version first as described in [SKILL.md](SKILL.md). These templates use the current API. Replace the identity placeholder with your existing server-side auth, the dashboard UID, public app origin, and trusted proxy egress. They are not a new auth system or proof of a working deployment.

## Session-guarded App Router route

Create `app/api/grafana/[...path]/route.ts`:

```ts
import { handleGrafanaProxy } from 'next-grafana-auth'
import type { GrafanaProxyConfig } from 'next-grafana-auth'

type ServerIdentity = { email: string; role?: unknown }

async function getServerIdentity(): Promise<ServerIdentity | null> {
  // PLACEHOLDER: replace with your existing SERVER-SIDE session lookup.
  // Return null for absent, invalid, expired, or revoked sessions.
  // Until replaced, this rejects every request. Never return a demo user.
  return null
}

function mapGrafanaRole(role: unknown): GrafanaProxyConfig['userRole'] {
  // Adapt only to roles granted by your trusted server authorization policy.
  if (role === 'Admin') return 'Admin'
  if (role === 'Editor') return 'Editor'
  return 'Viewer'
}

async function handler(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const identity = await getServerIdentity()
  if (!identity?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const grafanaUrl = process.env.GRAFANA_INTERNAL_URL
  if (!grafanaUrl) {
    return Response.json({ error: 'Missing GRAFANA_INTERNAL_URL' }, { status: 500 })
  }

  return handleGrafanaProxy(request, {
    grafanaUrl,
    userEmail: identity.email,
    userRole: mapGrafanaRole(identity.role),
    pathPrefix: '/api/grafana',
  }, (await params).path)
}

// GET serves dashboard pages/assets. POST is needed for dashboard data queries.
export { handler as GET, handler as POST }
```

Keep only methods needed by your dashboard. Add PUT, PATCH, DELETE, or HEAD only for operations you actually support, using the same guarded handler. Restrict application access before the helper if not every signed-in user may view Grafana. `Viewer` is a safe mapping default, not a substitute for that access policy. Never get email or role from client headers, query parameters, or request bodies. The helper does not authenticate the caller.

Reuse the explicit equality-based role mapper above, or reject unmatched roles with equally strict checks. Do not replace it with an unchecked cast or `roles[String(value)]` on a plain object: inherited keys such as `constructor` and `__proto__` are not Grafana roles. The helper rejects invalid roles with 400, but that is not a replacement for the route's own access policy. Diagnostic answers should reuse this fail-closed route template instead of inventing an incomplete identity helper or mapper.

For NextAuth v4 or Clerk, replace the placeholder using [server-side identity sketches](branches.md#server-side-identity-sketches). Their app-specific imports, metadata, callbacks, and installed provider APIs must be confirmed in the consumer.

## Client dashboard component

For example, `app/dashboard/GrafanaPanel.tsx`:

```tsx
'use client'

import { GrafanaDashboard } from 'next-grafana-auth/component'

export default function GrafanaPanel() {
  return (
    <section style={{ height: '80vh' }}>
      <GrafanaDashboard
        baseUrl="/api/grafana"
        dashboardUid="replace-with-your-dashboard-uid"
      />
    </section>
  )
}
```

Use the UID from your Grafana instance, not a demo UID. The component fills its parent, so keep the explicit height. The browser uses the application proxy, not the private Grafana URL. Do not add URL `authToken` credentials to work around session failures.

## Minimal Grafana configuration

The exact auth and sub-path keys follow the package Getting Started guide and canonical Compose stack linked in [references.md](references.md). For a production public origin `https://app.example.com`, use this `grafana.ini` block:

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
auto_sign_up = true
whitelist = <trusted-nextjs-proxy-egress-ip-or-cidr>
enable_login_token = true
```

Replace the whitelist placeholder with the IPs/CIDRs Grafana actually sees as the trusted Next.js proxy source. Do not use loopback unless Grafana actually sees loopback, including across Docker boundaries. Restrict Grafana network access to that proxy. `auto_sign_up` creates Grafana users for trusted proxy identities, not application accounts. The role mapping is exactly `Role:X-WEBAUTH-ROLE`, not its reverse.

For local host-run Next.js, substitute the actual app origin, for example `http://localhost:3000/api/grafana/`. Production requires HTTPS and appropriate cookie settings. Do not copy the Compose stack's development-only cookie settings into production. Restart Grafana after configuration changes, without deleting stored data.

| Next.js runtime | Server-only application environment |
|---|---|
| On host, Grafana published as `3001:3000` | `GRAFANA_INTERNAL_URL=http://localhost:3001` |
| Same Compose network as service `grafana` | `GRAFANA_INTERNAL_URL=http://grafana:3000` |

The internal URL has no proxy sub-path appended. The helper adds it. For `/observability`, change all four values together: route to `app/observability/[...path]/route.ts`, proxy `pathPrefix` to `/observability`, client `baseUrl` to `/observability`, and public `root_url` to `https://app.example.com/observability/`. Keep `serve_from_sub_path = true`.

## API options used in this skill

These are library options/props, not Grafana settings or environment variable names.

| Source API property | Contract |
|---|---|
| `GrafanaProxyConfig.grafanaUrl` | Required HTTP(S) URL reachable from Next.js |
| `GrafanaProxyConfig.userEmail` | Required trusted email containing `@` and only printable, non-whitespace ASCII (`!` through `~`), with no control characters or Unicode |
| `GrafanaProxyConfig.userRole` | Required `Admin`, `Editor`, or `Viewer` |
| `GrafanaProxyConfig.pathPrefix` | Default pathPrefix: `'/api/grafana'`. Must start with `/` and contain no `..` anywhere. Trailing slashes are normalized. `/` is allowed. |
| `GrafanaProxyConfig.requestTimeoutMs` | Default requestTimeoutMs: `10000`. Must be finite and greater than zero. Header timeout only, not a response-body deadline. |
| `GrafanaProxyConfig.forwardRequestHeaders` | Default `[]`. Extra header names are trimmed and case-insensitive, still safety-filtered. Can never forward inbound Cookie, Authorization, X-WEBAUTH-*, Host, hop-by-hop headers, or headers named by Connection. |
| `GrafanaDashboardProps.baseUrl` | Required proxy URL aligned with the route and pathPrefix, not an implicit default |
| `GrafanaDashboardProps.dashboardUid` | Required real Grafana dashboard UID |
| `GrafanaDashboardProps.params` | Optional Grafana URL parameters, distinct from the route's async params |
| `GrafanaDashboardProps.fallbackTimeoutMs` | Client loading timeout, separate from the proxy header timeout |
| `GrafanaDashboardProps.sandbox` | Default sandbox: `'allow-scripts allow-same-origin allow-forms'`. `null` removes the attribute. This is not an isolation boundary for untrusted same-origin content. |
| `GrafanaDashboardProps.style` | Container inline styles, or give its parent a height |
| `GrafanaUrlParams.authToken` | Adds credentials to a URL query parameter. Prefer the existing server session instead. |

The proxy buffers response bodies and clears its timer once upstream headers arrive. An eventual body-read failure can still return 500. Raising the client loading timeout cannot fix an upstream 504. See [status ownership and timeout triage](troubleshooting.md).
