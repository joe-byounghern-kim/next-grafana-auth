# Getting Started

Use this guide to choose the fastest correct path for adopting `next-grafana-auth`.

## Choose Your Path

| Goal | Path | Time | Best when |
|---|---|---:|---|
| Validate quickly | [Path 1: Sandbox](#path-1-sandbox-quick-evaluation) | 5 min | You want proof before integration |
| Integrate now | [Path 2: Basic integration](#path-2-basic-integration) | 15 min | You already have session/auth logic |
| OAuth production | [Path 3: NextAuth.js](#path-3-nextauthjs-production) | 30 min | You use NextAuth providers |
| Custom auth/session | [Path 4: Custom session](#path-4-custom-session-production) | 45 min | You need full auth/session control |

## Prerequisites

- Node.js >= 18.18.0
- Next.js >= 15.0.0
- React >= 18.0.0
- Grafana >= 11.6

## Integration Contract (Must Hold)

Keep these aligned in every path:

1. Route path (recommended): `app/api/grafana/[...path]/route.ts`
2. Proxy prefix: `pathPrefix` default is `/api/grafana`
3. Grafana sub-path config:

```ini
[server]
root_url = %(protocol)s://%(domain)s:%(http_port)s/api/grafana
serve_from_sub_path = true
```

4. Internal URL must match topology:
   - Host-run Next.js + Docker Grafana: `GRAFANA_INTERNAL_URL=http://localhost:3001`
   - App and Grafana in same Docker network: `GRAFANA_INTERNAL_URL=http://grafana:3000`
5. User identity sent to proxy must be server-derived and map roles to `Admin | Editor | Viewer`.

Security reminders:
- Never trust inbound `X-WEBAUTH-*` from the client.
- Never forward inbound `Authorization` or `Cookie` to Grafana.
- Prefer session-cookie auth-proxy flow over URL `authToken` usage.

## Path 1: Sandbox (Quick Evaluation)

Use this when you need a fast functional proof.

```bash
cd sandbox
./quick-start.sh
```

Then open `http://localhost:3000`.

What this validates:
- Proxy route behavior
- Embedded dashboard rendering
- Header/cookie flow in a known-good environment

Next:
- Full sandbox checklist: [sandbox/README.md](./sandbox/README.md)

## Path 2: Basic Integration

Use this when you already have app auth/session and want minimal integration steps.

### Step 1: Install

```bash
npm install next-grafana-auth
```

If package is not yet published:

```bash
npm pack
npm install ./next-grafana-auth-1.0.0.tgz
```

### Step 2: Add proxy route

Create `app/api/grafana/[...path]/route.ts` and call `handleGrafanaProxy()` with:

- `grafanaUrl: process.env.GRAFANA_INTERNAL_URL`
- `userEmail`: authenticated user email from your server session
- `userRole`: mapped Grafana role (`Admin | Editor | Viewer`)
- `path`: `(await params).path` for Next.js 15 route handlers

Reference implementation:
- API contract: [docs/API_REFERENCE.md](./docs/API_REFERENCE.md)
- Working example: [examples/basic/README.md](./examples/basic/README.md)

### Step 3: Embed dashboard

Render `<GrafanaDashboard />` in your page with:

- `baseUrl="/api/grafana"`
- `dashboardUid="..."`
- optional `dashboardSlug`, `params`

Component props and defaults:
- [docs/API_REFERENCE.md](./docs/API_REFERENCE.md)

### Step 4: Configure Grafana

Minimum required settings:

```ini
[auth.proxy]
enabled = true
header_name = X-WEBAUTH-USER
headers = Role:X-WEBAUTH-ROLE
enable_login_token = true
```

For production, configure auth-proxy `whitelist` for trusted proxy egress.

### Step 5: Verify

- `GET /api/grafana/api/health` succeeds for authenticated user
- Dashboard renders through `/api/grafana/...` path
- No route/prefix/sub-path mismatch

## Path 3: NextAuth.js (Production)

Use this when your identity source is NextAuth.

Checklist:
1. Ensure NextAuth session includes user email and app role.
2. Map app role to Grafana role before proxy call.
3. In proxy route, reject missing session (`401`) before calling `handleGrafanaProxy`.
4. Keep route/prefix/sub-path contract aligned.

Working reference:
- [examples/nextauth/README.md](./examples/nextauth/README.md)

## Path 4: Custom Session (Production)

Use this when your app owns session lifecycle/storage.

Checklist:
1. Resolve user from your session store on the server.
2. Map app roles to `Admin | Editor | Viewer`.
3. Return unauthorized if session lookup fails.
4. Proxy with `handleGrafanaProxy` and aligned path contract.

Working reference:
- [examples/custom-session/README.md](./examples/custom-session/README.md)

## Verification Commands

Run in your integrating app/repo:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

If blocked, use:
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## Success Checklist

- [ ] Route exists at `/api/grafana/[...path]/route.ts` (or aligned custom equivalent)
- [ ] `GRAFANA_INTERNAL_URL` matches runtime topology
- [ ] Grafana sub-path config matches proxy path
- [ ] Auth/session returns server-trusted `email` and mapped `role`
- [ ] Dashboard loads through proxy path

## Need Help

- Troubleshooting: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- API details: [docs/API_REFERENCE.md](./docs/API_REFERENCE.md)
- Examples index: [examples/README.md](./examples/README.md)
- Bug reports: https://github.com/joe-byounghern-kim/next-grafana-auth/issues
