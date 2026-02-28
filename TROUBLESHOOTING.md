# Troubleshooting

Use this playbook when integrating `next-grafana-auth`.

## Fast Triage

Run these checks first, in order:

1. Confirm compatibility: Node >= 18.18.0, Next.js >= 15, React >= 18.
2. Confirm default route or aligned custom route:
   - Recommended: `/api/grafana/[...path]/route.ts`
   - If custom route: align `pathPrefix` and Grafana `root_url`.
3. Confirm `GRAFANA_INTERNAL_URL` matches topology:
   - Host-run Next.js + Docker Grafana: `http://localhost:3001`
   - Same Docker network: `http://grafana:3000`
4. Confirm server-side identity mapping returns `{ email, role }` where role is one of `Admin | Editor | Viewer`.
5. Confirm Grafana auth-proxy is enabled and header names match.

## Decision Tree

- `401/403` -> go to [Auth failures](#auth-failures-401403).
- `404` or wrong dashboard path -> go to [Route and sub-path mismatch](#route-and-sub-path-mismatch-404).
- `504` or iframe never loads -> go to [Timeout/loading issues](#timeoutloading-issues-504-or-stuck-loading).
- Blank iframe or embedded login screen -> go to [Embedding and Grafana config](#embedding-and-grafana-config-blank-iframe).
- `ECONNREFUSED` / `ENOTFOUND` -> go to [Docker and network issues](#docker-and-network-issues).

## Auth Failures (401/403)

Symptoms:
- Proxy responds with unauthorized.
- Dashboard request fails after navigation/refresh.

Checks:
1. In your route handler, confirm authenticated user is present before calling `handleGrafanaProxy`.
2. Confirm mapped role is exactly one of `Admin`, `Editor`, `Viewer`.
3. Confirm email is valid and non-empty.
4. Confirm session cookie/token lookup is working on server.

Fixes:
- Map your app roles to Grafana roles explicitly.
- Return `401` when session is missing instead of proxying invalid identities.
- Ensure session lookup runs in server context.

Verify:
- Request `GET /api/grafana/api/health` from your app and confirm success for authenticated users.

## Route and Sub-Path Mismatch (404)

Symptoms:
- Requests to `/api/grafana/...` return 404.
- Proxy route exists but dashboard path is wrong.

Checks:
1. Verify route file path exists:
   - `app/api/grafana/[...path]/route.ts`
2. Verify component `baseUrl` matches route prefix.
3. Verify Grafana config alignment:
   - `root_url = .../api/grafana`
   - `serve_from_sub_path = true`
4. If using custom path, ensure `pathPrefix` in `handleGrafanaProxy` config matches exactly.

Fixes:
- Revert to default route prefix (`/api/grafana`) unless custom path is required.
- Keep route path, `baseUrl`, `pathPrefix`, and Grafana `root_url` aligned as one contract.

Verify:
- Hit `GET /api/grafana/api/health` and check status is not 404.

## Timeout/Loading Issues (504 or stuck loading)

Symptoms:
- Proxy returns timeout.
- Loading spinner does not resolve.

Checks:
1. Verify Grafana is reachable from the Next.js server/container.
2. Verify `GRAFANA_INTERNAL_URL` points to the correct host/port for current topology.
3. Verify dashboard UID exists in Grafana.
4. Confirm no firewall/network policy blocks between app and Grafana.

Fixes:
- Correct internal URL and container DNS names.
- Increase `requestTimeoutMs` only after confirming connectivity.
- Use the package fallback UI and retry behavior; do not disable error states.

Verify:
- Proxy health endpoint succeeds and dashboard route returns content through proxy.

## Embedding and Grafana Config (blank iframe)

Symptoms:
- iframe stays blank.
- Grafana login appears inside iframe.

Checks:
1. Grafana server config includes:

```ini
[server]
root_url = %(protocol)s://%(domain)s:%(http_port)s/api/grafana
serve_from_sub_path = true

[security]
allow_embedding = true
cookie_samesite = none
cookie_secure = true

[auth.proxy]
enabled = true
header_name = X-WEBAUTH-USER
headers = Role:X-WEBAUTH-ROLE
enable_login_token = true
```

2. Proxy route uses trusted server-derived `userEmail` and `userRole`.
3. Browser/app protocol and Grafana protocol are compatible for your deployment.

Fixes:
- Correct Grafana config and restart Grafana.
- Align cookie/security options to your protocol/origin model.

Verify:
- Embedded dashboard loads without redirecting to Grafana login form.

## Docker and Network Issues

Symptoms:
- `ECONNREFUSED`
- `ENOTFOUND`
- intermittent upstream errors

Checks:
1. If app is on host: use `http://localhost:3001`.
2. If app is in Docker: use `http://grafana:3000` and shared network.
3. Confirm container health and logs.
4. Confirm service names match `docker-compose.yml`.

Fixes:
- Use service DNS names inside Docker, not `localhost`.
- Put app and Grafana on the same Docker bridge network.

Verify:
- From app container, curl/ping Grafana service successfully.

## Security-Specific Troubles

If behavior seems inconsistent with headers:

- Remember: `X-WEBAUTH-*` is set by the server-side proxy to Grafana upstream, not by the browser.
- Do not debug this by expecting browser request headers to show trusted upstream identity headers.
- Validate via server logs, integration-style checks, and Grafana behavior through proxy responses.

## Common Error Map

| Error | Likely cause | Primary fix |
|---|---|---|
| `Unauthorized` | Missing/invalid session identity | Fix auth/session lookup and role mapping |
| `Invalid user role` | App role not mapped to Grafana roles | Map to `Admin | Editor | Viewer` |
| `Invalid Grafana URL` | Wrong `GRAFANA_INTERNAL_URL` | Set topology-correct internal URL |
| `404 Not Found` | Route/prefix/sub-path mismatch | Align route + `pathPrefix` + `root_url` |
| `ECONNREFUSED` | Grafana unavailable | Start Grafana, verify host/port/network |
| `ENOTFOUND` | Wrong hostname in Docker | Use service name (`grafana`) |
| `Grafana request timed out` | Network latency/connectivity | Fix reachability, then tune timeout |

## Escalation Checklist

Before opening an issue, include:

1. Next.js, Node.js, Grafana versions.
2. Current route path and `baseUrl`.
3. Sanitized `GRAFANA_INTERNAL_URL` value (host/port only).
4. Relevant app and Grafana logs.
5. Exact request that fails (`/api/grafana/...`) and status code.

If still blocked, open an issue:
- https://github.com/joe-byounghern-kim/next-grafana-auth/issues
