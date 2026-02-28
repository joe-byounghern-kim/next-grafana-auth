# SKL-004 Universal Basic Setup Contract

## Mandatory Preconditions
- Node >= 18.18, Next.js >= 15, React >= 18, Grafana >= 11.6
- Server-side auth source can provide trusted `email` + mapped `role`

## Mandatory Setup Steps
1. Install package `next-grafana-auth`.
2. Add route `app/api/grafana/[...path]/route.ts` using `handleGrafanaProxy`.
3. Configure `GRAFANA_INTERNAL_URL` for topology.
4. Configure Grafana auth-proxy headers and sub-path alignment.
5. Render `GrafanaDashboard` with `baseUrl="/api/grafana"`.

## Mandatory Invariants
- Never trust inbound `X-WEBAUTH-*`.
- Never forward inbound `Authorization` or `Cookie` to Grafana.
- Keep route/baseUrl/pathPrefix/root_url aligned.

## Verification Signals
- `GET /api/grafana/api/health` succeeds for authenticated user.
- Dashboard loads via `/api/grafana/...`.
- No mismatch errors (`404`, unauthorized, topology resolution).
