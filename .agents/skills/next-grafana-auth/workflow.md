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
- await the App Router `params` promise and pass `(await params).path` as the third argument
- validate the internal URL configuration without exposing it to the client
- use the selected proxy base path as `pathPrefix` when it differs from `/api/grafana`

`handleGrafanaProxy` replaces inbound `X-WEBAUTH-*` headers and does not forward inbound `Authorization` or `Cookie` headers. Export the HTTP methods your Grafana use case needs, including `GET` for dashboard rendering.

## 4. Configure Grafana and the application

- Set `GRAFANA_INTERNAL_URL` for the selected deployment topology.
- Configure Grafana auth-proxy headers:
  - `X-WEBAUTH-USER`
  - `X-WEBAUTH-ROLE`
- Enable Grafana `allow_embedding` and `serve_from_sub_path`.
- Keep the route path, `pathPrefix`, component `baseUrl`, Grafana `root_url`, and sub-path settings aligned.
- Set production `root_url` to the public application origin and proxy path, not the private Grafana URL.
- For production, set auth-proxy whitelist to trusted proxy egress CIDRs/IPs.

See the [Grafana configuration example](https://github.com/joe-byounghern-kim/next-grafana-auth/blob/main/GETTING_STARTED.md#4-configure-grafana-auth-proxy-and-sub-path).

## 5. Embed the dashboard

Import `GrafanaDashboard` from `next-grafana-auth/component` in a client component. Set `baseUrl` to the selected proxy path and use a valid dashboard UID. Give the parent or component an explicit height. Do not point the iframe directly at Grafana or add URL `authToken` credentials to solve session problems.

## 6. Validate

- Run the consuming application's documented lint, type-check, test, and build commands. Do not assume it defines this repository's npm scripts.
- From an authenticated application session, request `<proxyBasePath>/api/health` and confirm a success response.
- Request `<proxyBasePath>/api/user` in the same session and verify the expected Grafana identity (`login` matches the server-derived email when `header_property = username`). Check the intended role's permissions against a protected operation. Health alone proves reachability, not authorization.
- In separate signed-out and invalid/revoked-session tests, confirm the proxy rejects requests with `401` or the application's documented unauthorized response. Send spoofed `X-WEBAUTH-*` headers in a controlled test and confirm they cannot authenticate a signed-out request or change a signed-in identity.
- Open the dashboard route and confirm the intended dashboard and panels render through `<proxyBasePath>` without a Grafana login prompt. HTTP page success and iframe load events are not proof of panel rendering.

Use the browser session for these checks. `curl` does not inherit browser cookies. If using local test-session credentials, never log or share them. Repository verifier scripts depend on the local demo stack and provisioning. Do not run them against a consumer's Grafana as a generic integration test.

If a check fails, use [troubleshooting.md](troubleshooting.md) for the matching symptom. In the final handoff, list changed files, actual checks and results, and any unperformed checks or remaining blockers. Do not claim browser validation from build or HTTP checks.
