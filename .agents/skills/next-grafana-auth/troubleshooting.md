# Troubleshooting

## 401/403 Unauthorized
- Check: server auth lookup returns `{ email, role }` from trusted session source.
- Fix: reject missing session before proxy; normalize role to `Admin | Editor | Viewer`.
- Verify: authenticated `<proxyBasePath>/api/user` returns the expected identity and signed-out proxy requests are rejected. Confirm the intended role's permissions. Health is a reachability check only.

## 404 Route Mismatch
- Check: route exists at `app/api/grafana/[...path]/route.ts` or the selected custom catch-all route.
- Check: `baseUrl`, `pathPrefix`, `root_url`, and `serve_from_sub_path` use the same proxy path.
- Fix: align all route/sub-path settings.
- Verify: `<proxyBasePath>/api/health` is not 404. The internal URL and public Grafana root URL serve different purposes.

## ECONNREFUSED / ENOTFOUND
- Check: topology and `GRAFANA_INTERNAL_URL`.
- Fix: use topology-correct host (`localhost:3001` or `grafana:3000`).
- Verify: Grafana reachable from app runtime.

## Blank Iframe / Grafana Login Form
- Check: Grafana `allow_embedding` and auth proxy config.
- Check: the iframe parent has a height, public `root_url` uses the app origin, and browser console/network requests show no cookie or redirect failures.
- Check: incoming spoofable headers are not trusted (`X-WEBAUTH-*`, `Authorization`, `Cookie`).
- Fix: align `auth.proxy` and security settings; restart Grafana.
- Verify: dashboard panels render without a login prompt. A load event can also fire for login and error pages.

## 504 Timeout / Stuck Loading
- Check: upstream reachability and dashboard UID validity.
- Fix: restore connectivity first. Tune upstream `requestTimeoutMs` separately from client `fallbackTimeoutMs` only after identifying which timeout fired.
- Verify: dashboard reaches ready state.

## Escalation details

Capture:
- identity source and deployment topology
- sanitized internal topology and public proxy path, without credentials or private host details
- results for authenticated health, identity, signed-out rejection, and browser rendering checks
- exact symptom class (401/403, 404, connectivity, iframe/login, timeout)

Do not include session cookies, URL auth tokens, passwords, or unsanitized network captures. Do not reset Grafana volumes or change authentication settings as a generic troubleshooting step.
