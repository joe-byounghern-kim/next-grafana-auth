# Integration choices

## Identity source

| Existing authentication | Use | Required output |
|---|---|---|
| Uses `getServerSession` / NextAuth session primitives | NextAuth | server-derived `{ email, role }` mapper |
| Uses `@clerk/nextjs/server` helpers | Clerk | server-derived `{ email, role }` mapper |
| Uses custom DB/session middleware | Custom session | server-derived `{ email, role }` mapper |

Use the identity mechanism already on the production request path, not a new auth provider or a demo credential store. The NextAuth example uses v4 `getServerSession`. For other auth-provider versions, use the application's existing server API rather than assuming the example's API applies.

## Server-side identity sketches

Replace only `getServerIdentity()` in the [route template](templates.md#session-guarded-app-router-route). Keep its early session guard and safe role mapper. These sketches rely on the consumer's existing authentication and authorization policy, not new provider setup.

### NextAuth v4

```ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth' // Your existing v4 options, not a new provider.

async function getServerIdentity() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null
  return {
    email: session.user.email,
    role: 'role' in session.user ? session.user.role : undefined,
  }
}
```

Confirm the existing server session callbacks or trusted DB lookup supply the role. Do not copy a role from a client session update without server authorization. If no role is exposed, the template maps to Viewer. If your app uses different role names, explicitly map that server policy instead. Confirm invalid/revoked-session handling in the existing auth system.

### Clerk

First run `npm ls @clerk/nextjs` and confirm the server helper API, middleware prerequisites, user fields, and metadata access against that installed Clerk version. This is a mapper sketch, not a version-independent Clerk setup guide. Use the existing Clerk middleware/session validation. Do not replace the API with client hooks or browser-submitted metadata.

```ts
import { currentUser } from '@clerk/nextjs/server'

async function getServerIdentity() {
  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress
  if (!user || !email) return null
  return { email, role: user.privateMetadata.grafanaRole }
}
```

`grafanaRole` is an application-defined, server-managed metadata key, not a built-in Clerk role. Read it only on the server and allow only authorized backend code to write it. Never use user-editable unsafe metadata for privileges. Map only Admin/Editor/Viewer via the route template, or reject users that the application's access policy does not permit. Do not send private metadata to the client. The helper can call Clerk's Backend API, so account for provider rate limits on asset-heavy proxy routes. See [Clerk currentUser](https://clerk.com/docs/reference/nextjs/app-router/current-user) and [Backend User](https://clerk.com/docs/reference/backend/types/backend-user) for the API matching your SDK.

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
