# Integration choices

## Identity source

| Existing authentication | Use | Required output |
|---|---|---|
| Uses `getServerSession` / NextAuth session primitives | NextAuth | server-derived `{ email, role }` mapper |
| Uses `@clerk/nextjs/server` helpers | Clerk | server-derived `{ email, role }` mapper |
| Uses custom DB/session middleware | Custom session | server-derived `{ email, role }` mapper |

Use the identity mechanism already on the production request path, not a new auth provider or a demo credential store. The NextAuth example uses v4 `getServerSession`. For other auth-provider versions, use the application's existing server API rather than assuming the example's API applies.

## Grafana URL

| Application and Grafana deployment | Set `GRAFANA_INTERNAL_URL` |
|---|---|
| Next.js runs on host, Grafana in Docker | `http://localhost:3001` |
| Next.js and Grafana in same Docker network | `http://grafana:3000` |

Use the URL resolvable from the Next.js runtime, not from the browser or workstation by default.

The internal URL is not Grafana's public `root_url`. For production, `root_url` must use the public application origin and aligned proxy sub-path, such as `https://app.example.com/api/grafana/`.

## Custom proxy path

For `/observability`, align all four settings:

| Setting | Value |
|---|---|
| App Router catch-all route | `app/observability/[...path]/route.ts` |
| Proxy config | `pathPrefix: '/observability'` |
| Component prop | `baseUrl="/observability"` |
| Grafana public root URL | `https://app.example.com/observability/` with `serve_from_sub_path = true` |

## Confirm before implementation

- Server-derived email and a role mapped to `Admin`, `Editor`, or `Viewer`
- `GRAFANA_INTERNAL_URL` for the selected topology
- One aligned proxy path across the route, `pathPrefix`, `baseUrl`, and Grafana `root_url`

## Security requirements

- Never trust inbound `X-WEBAUTH-*` headers.
- Never forward inbound `Authorization` or `Cookie` headers to Grafana.
