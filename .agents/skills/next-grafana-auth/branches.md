# branches

## Deterministic Decision Table

### Auth Branch (Select Exactly One)
| If project signals | Select branch | Required output |
|---|---|---|
| Uses `getServerSession` / NextAuth session primitives | NextAuth | server-derived `{ email, role }` mapper |
| Uses `@clerk/nextjs/server` helpers | Clerk | server-derived `{ email, role }` mapper |
| Uses custom DB/session middleware | Custom session | server-derived `{ email, role }` mapper |

Tie-break rule: if multiple signals exist, pick the branch already used in production auth path.

### Topology Branch (Select Exactly One)
| Runtime topology signal | Set `GRAFANA_INTERNAL_URL` |
|---|---|
| Next.js runs on host, Grafana in Docker | `http://localhost:3001` |
| Next.js and Grafana in same Docker network | `http://grafana:3000` |

Tie-break rule: choose the value resolvable from the Next.js runtime namespace.

## Branch Exit Criteria
Before Phase 2, all must be explicit:
- selected auth branch
- selected topology branch
- `GRAFANA_INTERNAL_URL` value
- route contract (`/api/grafana`, `pathPrefix`, `baseUrl`, Grafana `root_url`)

## Shared Security Contract (Inherited)
- Never trust inbound `X-WEBAUTH-*` headers.
- Never forward inbound `Authorization` or `Cookie` headers to Grafana.
- Map roles only to `Admin | Editor | Viewer`.
