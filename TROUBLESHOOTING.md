# Troubleshooting

Use this fast triage table before changing timeouts or rewriting the integration. The [canonical Grafana guide](./examples/grafana/README.md) owns the shared stack configuration and lifecycle.

| Symptom | Check | Fix and exact verification |
|---|---|---|
| `401/403` | Confirm the server session resolves before `handleGrafanaProxy` and maps the application role to `Admin`, `Editor`, or `Viewer`. | Return `401` for a missing session, then run `curl -fsS http://localhost:3000/api/grafana/api/health >/dev/null` with an authenticated session. |
| `404` | Align `app/api/grafana/[...path]/route.ts`, component `baseUrl`, proxy `pathPrefix`, and Grafana `root_url`. | Keep the default `/api/grafana` contract and run `curl -fsS http://localhost:3000/api/grafana/api/health >/dev/null`. |
| `504` or stuck loading | Verify upstream reachability from the Next.js server or container before tuning `requestTimeoutMs`. | For host-run Next.js, run `curl -fsS http://localhost:3001/api/health >/dev/null`; for the same Docker network, use `http://grafana:3000`. Fix reachability first. |
| Blank iframe or login form | Check Grafana embedding, auth-proxy, cookie, and browser/Grafana protocol settings. | Align `allow_embedding`, auth-proxy headers, and cookie settings, then run `docker compose -f examples/docker-compose.yml config --quiet`. |
| `ECONNREFUSED` or `ENOTFOUND` | Confirm the topology-specific internal URL and Docker service name. | Host-run Next.js uses `GRAFANA_INTERNAL_URL=http://localhost:3001`; a container on the shared network uses `GRAFANA_INTERNAL_URL=http://grafana:3000`. Verify with `curl -fsS http://localhost:3001/api/health >/dev/null` from the host or the equivalent service URL from the app container. |
| Missing datasource or dashboard | Confirm the canonical provisioning tree is mounted and the Grafana data volume is not masking changed assets. | Reset the local volume, restart the stack, and rerun the verifier: `docker compose -f examples/docker-compose.yml down -v`, `docker compose -f examples/docker-compose.yml up -d`, then `GRAFANA_BASE_URL=http://localhost:3001/api/grafana scripts/verify-grafana.sh`. |

The verifier command has binary checks for Grafana health, the provisioned `testdata` datasource, the `demo-dashboard` dashboard, and a TestData query. Stop at the first failing check and capture its output before escalating.
