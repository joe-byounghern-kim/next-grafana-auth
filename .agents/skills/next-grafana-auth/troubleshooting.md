# troubleshooting

## 401/403 Unauthorized
- Check: server auth lookup returns `{ email, role }` from trusted session source.
- Fix: reject missing session before proxy; normalize role to `Admin | Editor | Viewer`.
- Verify: authenticated `GET /api/grafana/api/health` succeeds.

## 404 Route Mismatch
- Check: route exists at default `/api/grafana/[...path]/route.ts` or custom catch-all route.
- Check: `baseUrl`, `pathPrefix`, `root_url`, `serve_from_sub_path` align to the same route contract.
- Fix: align all route/sub-path settings.
- Verify: `/api/grafana/api/health` is not 404.

## ECONNREFUSED / ENOTFOUND
- Check: topology and `GRAFANA_INTERNAL_URL`.
- Fix: use topology-correct host (`localhost:3001` or `grafana:3000`).
- Verify: Grafana reachable from app runtime.

## Blank Iframe / Grafana Login Form
- Check: Grafana `allow_embedding` and auth proxy config.
- Check: incoming spoofable headers are not trusted (`X-WEBAUTH-*`, `Authorization`, `Cookie`).
- Fix: align `auth.proxy` and security settings; restart Grafana.
- Verify: dashboard renders without login prompt.

## 504 Timeout / Stuck Loading
- Check: upstream reachability and dashboard UID validity.
- Fix: restore connectivity first, then tune timeout.
- Verify: dashboard reaches ready state.

## Escalation Evidence (When Still Blocked)

Capture and report:
- selected auth branch and topology branch (from `branches.md`)
- `GRAFANA_INTERNAL_URL` value used at runtime
- result for authenticated `GET /api/grafana/api/health`
- exact symptom class (401/403, 404, connectivity, iframe/login, timeout)
