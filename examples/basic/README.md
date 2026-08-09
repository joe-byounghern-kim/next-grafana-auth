# Basic Example

The Basic example is the smallest `next-grafana-auth` integration. It uses a hardcoded demo identity and deliberately has no authentication, so it is for local demonstration only.

Shared Grafana ownership and lifecycle: [examples/grafana/README.md](../grafana/README.md).

## Requirements and versions

Run the workflow from the repository root with Node.js `^22.22.2 || ^24.15.0 || >=26.0.0`, npm `12.0.2` or a newer npm 12 patch, Docker Compose v2, and `curl` available. The example itself uses Next `16.3.0` and React `19.2.8`.

## Clean-clone workflow

Run this exact block from the repository root:

```bash
set -euo pipefail
npm ci
npm run build
docker compose -f examples/docker-compose.yml up -d
npm ci --prefix examples/basic
cp examples/basic/.env.example examples/basic/.env
npm run dev --prefix examples/basic
```

The development server listens on `http://localhost:3000`.

## What to open

- Home: [`http://localhost:3000`](http://localhost:3000)
- Dashboard: [`http://localhost:3000/dashboard`](http://localhost:3000/dashboard)

The dashboard checks `/api/grafana/api/health` and embeds the provisioned `demo-dashboard` through the proxy.

## What this example demonstrates

- `app/api/grafana/[...path]/route.ts` derives the demo identity on the server and calls `handleGrafanaProxy` with `(await params).path`.
- The demo identity is `user@example.com` with the `Admin` Grafana role.
- `app/dashboard/page.tsx` imports `GrafanaDashboard` from `next-grafana-auth/component` and uses `/api/grafana` as its base URL.
- `GRAFANA_INTERNAL_URL` defaults to `http://localhost:3001` for a host-run Next.js process. Use `http://grafana:3000` only when the application itself runs inside the shared Compose network.

The shared stack provisions the dashboard and TestData datasource. Its ownership remains [`examples/docker-compose.yml`](../docker-compose.yml) and [`examples/provisioning/`](../provisioning/).

## Demo-only boundary

This route does not validate a session or authenticate the caller. The hardcoded identity and automatic access are local demo behavior. Do not deploy this route as an application authorization boundary.

## Production checklist

Before adapting this example for production:

- [ ] Derive the user from a server-side session or trusted identity provider.
- [ ] Enforce authorization and map application roles to `Admin`, `Editor`, or `Viewer`.
- [ ] Do not accept inbound identity, `Authorization`, or `Cookie` headers as the source of Grafana identity.
- [ ] Use HTTPS and configure Grafana auth-proxy `whitelist` for trusted proxy egress.
- [ ] Keep `GRAFANA_INTERNAL_URL` private to the server and preserve the `/api/grafana` path contract.

## Teardown

Stop the application with `Ctrl+C`, then use the canonical stack commands from the repository root:

```bash
docker compose --project-directory examples -f examples/docker-compose.yml down
```

Add `-v` to reset the local Grafana volume:

```bash
docker compose --project-directory examples -f examples/docker-compose.yml down -v
```
