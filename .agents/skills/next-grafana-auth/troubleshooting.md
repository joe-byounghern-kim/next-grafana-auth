# Troubleshooting

## Status-code ownership

Read the response body and Network request destination to identify the emitter. Upstream Grafana statuses are passed through, so a numeric code alone cannot identify its source. The helper does not generate 401, 403, or 404 itself.

| Status | Who returns it / meaning | Next check |
|---|---|---|
| 401 | The application's own session guard, before calling `handleGrafanaProxy`, as in the template. Grafana or another ingress can also return its own 401. | Validate the existing server session, including expiration/revocation, before proxying. |
| 400 | The helper received an invalid email, role, or path. | Email must contain `@` without whitespace, CR, LF, or NUL. Role must be Admin/Editor/Viewer. Catch-all segments exactly `.` or `..` are rejected. |
| 500 | The helper received invalid `grafanaUrl`, `pathPrefix`, or `requestTimeoutMs`, or an upstream fetch/body-read failure occurred. The template also returns 500 for missing GRAFANA_INTERNAL_URL. | Check HTTP(S) URL, prefix/timeout validation in [API options](templates.md#api-options-used-in-this-skill), and server-runtime DNS/connectivity. |
| 504 | The helper's upstream fetch aborted before response headers arrived within `requestTimeoutMs`. A gateway/upstream may also emit 504. | Identify the response source and check Grafana reachability from the actual Next.js runtime before tuning timeouts. |
| 404 | Usually Next.js route or Grafana sub-path/resource mismatch, not helper input validation. Grafana's own 404 is passed through. | Align all four paths, then check the requested dashboard/resource exists. |
| 3xx | Grafana redirects are returned to the browser with Location preserved, not followed by the helper. | Inspect the redirect destination and public root URL. Do not enable server-side redirect following with trusted identity headers. |
| 403 | Application access policy, Grafana authorization, or another ingress, not a helper-generated session status. | Confirm trusted role mapping and the intended protected operation's permissions. |

## Session rejection or permission failure

- Resolve email and role from the trusted existing server session. Return 401 for missing identity before invoking the helper, and enforce application access policy.
- Map roles only to `Admin`, `Editor`, or `Viewer`, using least privilege or explicit rejection for unknown roles. A signed-in user is not automatically allowed to use Grafana.
- Verify authenticated `<proxyBasePath>/api/user` has the expected identity (`login` matches server email with `header_property = username`), the intended role's permissions apply, and signed-out/revoked sessions are rejected. Health is only reachability.

## /api/grafana 404 or custom route mismatch

- Confirm the catch-all route exists. `/api/grafana` alone need not match `[...path]`, which requires at least one segment. Diagnose with `/api/grafana/api/health`, not only the bare base path.
- Align route, `pathPrefix`, `baseUrl`, and public `root_url`, keeping `serve_from_sub_path = true`. See [custom proxy path](branches.md#custom-proxy-path).
- Do not include the proxy path in GRAFANA_INTERNAL_URL as well: the helper appends it. Check asset paths, actual dashboard UID, and redirects in the browser.

## ECONNREFUSED / ENOTFOUND / upstream 500

- Check GRAFANA_INTERNAL_URL from the Next.js server/container, not from the browser. Host-run Next.js with Docker Grafana uses `http://localhost:3001`; a container in the same network uses `http://grafana:3000` when that is its service name.
- Test the aligned `<internalGrafanaOrigin><proxyBasePath>/api/health` from that runtime. Preserve the trusted proxy network boundary and never expose Grafana publicly to fix Docker DNS.

## Blank iframe or "iframe shows the Grafana login page"

- Use the exact [Grafana config](templates.md#minimal-grafana-configuration): auth.proxy enabled, header_name X-WEBAUTH-USER, header_property username, and **headers = Role:X-WEBAUTH-ROLE**. Do not reverse the mapping.
- Check auto sign-up policy and the whitelist matches the Next.js egress address Grafana sees, not an assumed loopback address inside a container. Restart Grafana after config changes without deleting data.
- Check allow_embedding, explicit iframe-parent height, public app-origin root URL, HTTPS/cookie policy, and browser console/network redirects. Do not point the iframe directly at private Grafana.
- Never fix login by accepting spoofed X-WEBAUTH-* or forwarding the application's Cookie or Authorization. `forwardRequestHeaders` cannot override those blocks. Do not put auth tokens in iframe URLs.
- Verify `/api/user`, signed-out rejection, intended permissions, and actual dashboard panel rendering. A load event also fires for login/error pages, so hiding the spinner is not proof of successful authentication.

## /api/grafana 504 or stuck loading

- Separate a real HTTP 504 from the component's loading fallback. Default proxy header timeout is 10000 ms, documented with [API options](templates.md#api-options-used-in-this-skill). The timer stops at response headers, before buffering the body, not after the entire response. A stalled body can therefore outlast it.
- Restore server-runtime connectivity, Grafana readiness, and upstream response-header latency first. Check the route's status/error body and the Network waterfall. An invalid UID is usually a resource error, not itself evidence of a header timeout.
- Tune `requestTimeoutMs` only after measuring which server timeout fired. `fallbackTimeoutMs` affects the client loading overlay only. Raising either does not repair routing, DNS, session validation, or Grafana configuration.
- Verify both a successful proxy request and actual panels rendering. Do not infer success from a spinner disappearing.

## Live/streaming panels don't update

The helper buffers response bodies and has no WebSocket upgrade support for Grafana Live. Ordinary dashboard loads or polling do not establish that Live works. See the [documented API limitation](https://github.com/joe-byounghern-kim/next-grafana-auth/blob/main/docs/API_REFERENCE.md#behavior-notes), using the matching tag for older releases. Use polling where appropriate or a separately designed, authenticated WebSocket-capable proxy if Live is required. Do not promise Live support or attempt to fix it by increasing request/iframe timeouts or forwarding Upgrade through this helper.

## Escalation details

Capture installed package and auth-provider versions, identity source, deployment topology, sanitized proxy path, exact status/body and redirect destination, plus actual authenticated-health, identity, signed-out rejection, permissions, and browser-render results. Say which checks were not run. Do not share cookies, URL auth tokens, private metadata, passwords, private host details, or unsanitized network captures. Never reset Grafana volumes, reset passwords, or change the auth provider as generic troubleshooting.
