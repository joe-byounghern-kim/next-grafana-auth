# Troubleshooting

Use this fast triage table before changing timeouts or rewriting the integration. The [canonical Grafana guide](./examples/grafana/README.md) owns the shared stack configuration and lifecycle.

| Symptom | Check | Fix and exact verification |
|---|---|---|
| `401/403` | Confirm the server session resolves before `handleGrafanaProxy` and maps the application role to `Admin`, `Editor`, or `Viewer`. | Sign in, request `/api/grafana/api/user` in that browser session, and verify identity and the intended permissions. Health alone does not validate authentication. Confirm signed-out requests are rejected. |
| `404` | Align the catch-all route, component `baseUrl`, proxy `pathPrefix`, and Grafana public `root_url`. | Use `/api/grafana` consistently, or align all four settings to your custom path. Request `<proxyBasePath>/api/health` through the app. |
| `504` or stuck loading | Verify upstream reachability from the Next.js server or container before tuning `requestTimeoutMs`. | For the local host-run stack, run `curl -fsS http://localhost:3001/api/grafana/api/health`; for the same Docker network use `http://grafana:3000/api/grafana/api/health`. Fix connectivity first. The iframe fallback timeout is separate from the proxy request timeout. |
| Blank iframe or login form | Check Grafana embedding, auth-proxy, cookie, public root URL, and browser console/network errors. Give the iframe container a height. | Enable `allow_embedding`, align identity headers and public sub-path, then reload the dashboard and verify panels render. Compose validation and an iframe load event are not browser-render checks. |
| `ECONNREFUSED` or `ENOTFOUND` | Confirm the topology-specific internal URL and Docker service name. | Host-run Next.js uses `GRAFANA_INTERNAL_URL=http://localhost:3001`; a container on the shared network uses `GRAFANA_INTERNAL_URL=http://grafana:3000`. Check the aligned Grafana health path from that same runtime. |
| Missing datasource or dashboard | Confirm the canonical provisioning tree is mounted and inspect Grafana provisioning logs. | Correct the provisioning mount and restart without removing volumes, then rerun `GRAFANA_BASE_URL=http://localhost:3001/api/grafana scripts/verify-grafana.sh`. Reset a volume only if its disposable data can be lost, using the [stack guide](./examples/grafana/README.md#logs-and-lifecycle). |

The verifier command has binary checks for Grafana health, the provisioned `testdata` datasource, the `demo-dashboard` dashboard, and a TestData query. Stop at the first failing check and capture its output before escalating.

`curl` does not share your browser's authenticated session. Supply local test-session credentials when needed without exposing them in logs or reports. The verifier's direct auth headers are for the local demo Grafana only, not application authentication.
