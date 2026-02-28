# SKL-006 Failure Taxonomy

## Failure Classes
- Auth failure (`401`/`403`): missing session user, invalid role mapping.
- Route mismatch (`404`): route/prefix/root_url not aligned.
- Topology resolution (`ECONNREFUSED`/`ENOTFOUND`): invalid `GRAFANA_INTERNAL_URL` for runtime.
- Embedding failure (blank iframe/login form): Grafana proxy/embedding settings misconfigured.
- Timeout/loading (`504` or stalled loading): upstream reachability or dashboard readiness delays.

## Deterministic Response Format
For each class:
1. First check
2. Fix action
3. Verify signal
4. Escalate when

## Class Mapping
- Auth failure
  - Check: server auth source returns `{ email, role }`, role in `Admin|Editor|Viewer`
  - Fix: map app roles to Grafana roles, fail unauthorized early
  - Verify: `GET /api/grafana/api/health` succeeds for authenticated user
  - Escalate: repeated unauthorized after two retries with confirmed session
- Route mismatch
  - Check: route at `/api/grafana/[...path]/route.ts`, `baseUrl`, `pathPrefix`, and `root_url` match
  - Fix: align all route/prefix/sub-path values
  - Verify: health endpoint not `404`
  - Escalate: mismatch persists after config restart
- Topology resolution
  - Check: runtime network topology and `GRAFANA_INTERNAL_URL`
  - Fix: use `localhost:3001` host+docker or `grafana:3000` container+container
  - Verify: Grafana reachable from app runtime
  - Escalate: container/network policy blocks remain
- Embedding failure
  - Check: `allow_embedding`, `auth.proxy` headers, cookie settings
  - Fix: align Grafana config and restart
  - Verify: dashboard renders without Grafana login prompt
  - Escalate: still blank after config and network checks
- Timeout/loading
  - Check: upstream reachability, dashboard UID validity, timeout config
  - Fix: resolve connectivity first, then tune `requestTimeoutMs`
  - Verify: proxy responses arrive and UI reaches ready state
  - Escalate: repeated timeout with healthy upstream
