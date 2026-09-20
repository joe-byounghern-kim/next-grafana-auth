# Integration workflow

## 1. Install

```bash
npm install next-grafana-auth
```

Confirm the package is listed in the application dependencies.

## 2. Choose identity, topology, and proxy path

Use [integration choices](branches.md) to choose the server-side identity source and `GRAFANA_INTERNAL_URL`. Set a proxy base path, normally `/api/grafana`.

## 3. Add the proxy route

Create `app/api/grafana/[...path]/route.ts`, or align an existing catch-all route:

- call `handleGrafanaProxy` with server-derived `userEmail` and `userRole`
- return unauthorized early when session identity is missing
- use the selected proxy base path as `pathPrefix` when it differs from `/api/grafana`

`handleGrafanaProxy` replaces inbound `X-WEBAUTH-*` headers and does not forward inbound `Authorization` or `Cookie` headers. Export the HTTP methods your Grafana use case needs, including `GET` for dashboard rendering.

## 4. Configure Grafana and the application

- Set `GRAFANA_INTERNAL_URL` for the selected deployment topology.
- Configure Grafana auth-proxy headers:
  - `X-WEBAUTH-USER`
  - `X-WEBAUTH-ROLE`
- Keep the route path, `pathPrefix`, component `baseUrl`, Grafana `root_url`, and sub-path settings aligned.
- For production, set auth-proxy whitelist to trusted proxy egress CIDRs/IPs.

See the [Grafana configuration example](https://github.com/joe-byounghern-kim/next-grafana-auth/blob/main/GETTING_STARTED.md#4-configure-grafana-auth-proxy-and-sub-path).

## 5. Embed the dashboard

Render `GrafanaDashboard` with `baseUrl` set to the selected proxy path and a valid dashboard UID. Do not point the iframe directly at Grafana.

## 6. Validate

- Run the consuming application's documented lint, type-check, test, and build commands. Do not assume it defines this repository's npm scripts.
- From an authenticated application session, request `<proxyBasePath>/api/health` and confirm a success response.
- Open the dashboard route and confirm the iframe renders through `<proxyBasePath>` without a Grafana login prompt.

If a check fails, use [troubleshooting.md](troubleshooting.md) for the matching symptom.
