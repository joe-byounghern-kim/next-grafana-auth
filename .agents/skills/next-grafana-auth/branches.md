# Integration choices

## Identity source

| Existing authentication | Use | Required output |
|---|---|---|
| Uses `getServerSession` / NextAuth session primitives | NextAuth | server-derived `{ email, role }` mapper |
| Uses `@clerk/nextjs/server` helpers | Clerk | server-derived `{ email, role }` mapper |
| Uses custom DB/session middleware | Custom session | server-derived `{ email, role }` mapper |

If more than one option applies, use the identity mechanism on the production request path.

## Grafana URL

| Application and Grafana deployment | Set `GRAFANA_INTERNAL_URL` |
|---|---|
| Next.js runs on host, Grafana in Docker | `http://localhost:3001` |
| Next.js and Grafana in same Docker network | `http://grafana:3000` |

Use the URL resolvable from the Next.js runtime, not from the browser or workstation by default.

## Confirm before implementation

- Server-derived email and a role mapped to `Admin`, `Editor`, or `Viewer`
- `GRAFANA_INTERNAL_URL` for the selected topology
- One aligned proxy path across the route, `pathPrefix`, `baseUrl`, and Grafana `root_url`

## Security requirements

- Never trust inbound `X-WEBAUTH-*` headers.
- Never forward inbound `Authorization` or `Cookie` headers to Grafana.
