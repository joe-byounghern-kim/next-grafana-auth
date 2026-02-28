# workflow

## Phase 0: Preconditions
Confirm all before changing code:
- Node >= 18.18
- Next.js >= 15
- React >= 18
- Grafana >= 11.6

If any precondition fails, stop and resolve environment first.

Install package in project:
```bash
npm install next-grafana-auth
```

Binary check:
- pass when package resolves from project dependencies
- fail when package is missing from dependency graph

## Phase 1: Select Branches
Use `branches.md` and lock two decisions:
1. Auth branch (NextAuth, Clerk, or custom session)
2. Topology branch (host+docker or container+container)
3. Proxy base path (`proxyBasePath`), default `/api/grafana`

Do not continue until both decisions are explicit.

## Phase 2: Implement Proxy Route
Create or validate catch-all proxy route (default `app/api/grafana/[...path]/route.ts`):
- call `handleGrafanaProxy` with server-derived `userEmail` and `userRole`
- return unauthorized early when session identity is missing
- keep route path aligned with `proxyBasePath`
- strip inbound `X-WEBAUTH-*`, `Authorization`, and `Cookie` from upstream forwarding path

Binary check:
- pass when route exists and exports GET, POST, PUT, PATCH, DELETE
- pass when spoofable inbound auth headers are stripped before upstream proxying
- fail when route path, handler wiring, or header-stripping logic is missing

## Phase 3: Configure Runtime and Grafana
- Set `GRAFANA_INTERNAL_URL` from topology branch.
- Configure Grafana auth-proxy headers:
  - `X-WEBAUTH-USER`
  - `X-WEBAUTH-ROLE`
- Keep Grafana `root_url` and sub-path settings aligned with route contract.
- For production, set auth-proxy whitelist to trusted proxy egress CIDRs/IPs.

Binary check:
- pass when topology URL resolves from app runtime and Grafana auth-proxy headers are configured
- fail when runtime cannot resolve Grafana or config alignment is missing

## Phase 4: Embed Dashboard
Render `GrafanaDashboard` with:
- `baseUrl` set to `proxyBasePath` (default `/api/grafana`)
- dashboard UID and optional slug/params

Binary check:
- pass when iframe points to `<proxyBasePath>/...` and dashboard route renders
- fail when iframe path bypasses proxy or page fails to mount

## Phase 5: Verify
Project verification:
```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

Runtime verification:
- authenticated `GET <proxyBasePath>/api/health` succeeds
- dashboard renders via `<proxyBasePath>/...`
- no route/prefix/root_url mismatch symptoms

Expected outcomes:
- health endpoint: authenticated success response
- dashboard route: visible panel content without Grafana login prompt

If any check fails, use `troubleshooting.md` and loop from failed phase.
