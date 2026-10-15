# Integration workflow

## 1. Install

```bash
npm install next-grafana-auth
```

Run `npm ls next-grafana-auth` and confirm the installed version. Use the matching tag docs if it differs from main, as described in [references.md](references.md). Do not assume main describes an older installed release.

## 2. Choose identity, topology, and proxy path

Use [integration choices](branches.md) to choose the server-side identity source and `GRAFANA_INTERNAL_URL`. Set a proxy base path, normally `/api/grafana`.

## 3. Add the proxy route

Create `app/api/grafana/[...path]/route.ts`, or align an existing catch-all route:

Start with the [copyable session-guarded route](templates.md#session-guarded-app-router-route), then replace its fail-closed `getServerIdentity()` placeholder with the existing server auth lookup in [branches.md](branches.md#server-side-identity-sketches).

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

Copy the exact [Grafana configuration block](templates.md#minimal-grafana-configuration). In particular use `header_property = username`, `headers = Role:X-WEBAUTH-ROLE`, and a whitelist matching the proxy egress Grafana actually sees. The role mapping must not be reversed. Do not confuse the private upstream URL with the public application root URL.

## 5. Embed the dashboard

Use the [client dashboard template](templates.md#client-dashboard-component), importing `GrafanaDashboard` from `next-grafana-auth/component`. Set `baseUrl` to the selected proxy path and use a valid dashboard UID. Give the parent or component an explicit height. Do not point the iframe directly at Grafana or add URL `authToken` credentials to solve session problems. See [API options](templates.md#api-options-used-in-this-skill) for the proxy header timeout, safe forwarding, path validation, and sandbox defaults.

## 6. Validate

- Run the consuming application's documented lint, type-check, test, and build commands. Do not assume it defines this repository's npm scripts.
- From an authenticated application session, request `<proxyBasePath>/api/health` and confirm a success response.
- Request `<proxyBasePath>/api/user` in the same session and verify the expected Grafana identity (`login` matches the server-derived email when `header_property = username`). Check the intended role's permissions against a protected operation. Health alone proves reachability, not authorization.
- In separate signed-out and invalid/revoked-session tests, confirm the proxy rejects requests with `401` or the application's documented unauthorized response. Send spoofed `X-WEBAUTH-*` headers in a controlled test and confirm they cannot authenticate a signed-out request or change a signed-in identity.
- Open the dashboard route and confirm the intended dashboard and panels render through `<proxyBasePath>` without a Grafana login prompt. HTTP page success and iframe load events are not proof of panel rendering.

Use the browser session for these checks. `curl` does not inherit browser cookies. If using local test-session credentials, never log or share them. Repository verifier scripts depend on the local demo stack and provisioning. Do not run them against a consumer's Grafana as a generic integration test.

If a check fails, use [troubleshooting.md](troubleshooting.md) for the matching symptom. In the final handoff, list changed files, actual checks and results, and any unperformed checks or remaining blockers. Do not claim browser validation from build or HTTP checks.

## Upgrading from 1.0.x

The [1.1.0 changelog](references.md) describes these changes, also present in later 1.1.x releases. Compare your installed version and target tag before upgrading:

- Redirects are returned to the browser with Location preserved, not followed by the helper with trusted identity headers. Re-test sign-in, dashboard, asset, and cross-origin redirect destinations. Keep the public root URL and all four path settings aligned so redirects stay on the intended app/proxy path. Do not restore server-side redirect following as a workaround.
- Hop-by-hop headers, including those named by Connection, are blocked even if explicitly requested in `forwardRequestHeaders`. Re-test any custom safe headers. Do not expect Cookie, Authorization, or inbound X-WEBAUTH-* to become forwardable.
- `sandbox={null}` is supported to remove the iframe sandbox attribute. The default sandbox remains unchanged, as quoted in [API options](templates.md#api-options-used-in-this-skill). Re-test scripts, forms, navigation, and the embedding trust boundary before changing it. This is optional, not an upgrade requirement.
- Trailing slashes are normalized in proxy and dashboard URLs. Re-test the default and any custom sub-path, query parameters, assets, and redirects with your actual root URL.

After upgrading, run the consumer's own checks and repeat authenticated identity/role, signed-out/revoked-session rejection, spoofed-header, and browser panel-render tests from step 6. Also re-test multiple upstream cookies and HEAD/bodyless responses if your integration uses them. A successful build is not end-to-end validation. Do not change provider APIs or Grafana storage as part of a generic package upgrade.
