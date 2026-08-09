# Custom Session Example

The Custom Session example shows a cookie-backed session flow around `next-grafana-auth`. Its credentials and in-memory session store are local demo behavior. It is not a production authentication implementation.

Shared Grafana ownership and lifecycle: [examples/grafana/README.md](../grafana/README.md).

## Requirements and versions

Run the workflow from the repository root with Node.js `^22.22.2 || ^24.15.0 || >=26.0.0`, npm `12.0.2` or a newer npm 12 patch, Docker Compose v2, and `curl` available. The example uses Next `16.3.0` and React `19.2.8`.

## Clean-clone workflow

Run this exact block from the repository root:

```bash
set -euo pipefail
npm ci
npm run build
docker compose -f examples/docker-compose.yml up -d
npm ci --prefix examples/custom-session
cp examples/custom-session/.env.example examples/custom-session/.env
npm run dev --prefix examples/custom-session
```

The development server listens on `http://localhost:3000`.

## Demo flow

1. Open [`http://localhost:3000/signin`](http://localhost:3000/signin).
2. Use one of the local demo accounts:

   | Email | Password | Grafana role |
   |---|---|---|
   | `admin@example.com` | `admin123` | Admin |
   | `user@example.com` | `user123` | Viewer |

3. Open [`http://localhost:3000/dashboard`](http://localhost:3000/dashboard).
4. Use **Sign Out** to delete the local session.

The dashboard checks `/api/grafana/api/health` and embeds `demo-dashboard` through the `/api/grafana` proxy.

## What this example demonstrates

- `app/api/auth/signin/route.ts` validates the demo credentials and sets an `httpOnly` `sessionId` cookie.
- `app/lib/session.ts` stores users and sessions in process memory with a 24-hour TTL and lazy expiration cleanup.
- `app/api/grafana/[...path]/route.ts` reads the cookie on the server, resolves the session, and passes the user's email and role to `handleGrafanaProxy` with `(await params).path`.
- `app/dashboard/page.tsx` imports `GrafanaDashboard` from `next-grafana-auth/component` and uses `/api/grafana` as its base URL.
- `GRAFANA_INTERNAL_URL` defaults to `http://localhost:3001` for a host-run Next.js process. Use `http://grafana:3000` only when the application itself runs inside the shared Compose network.

The shared Grafana stack and provisioning are owned by [`examples/docker-compose.yml`](../docker-compose.yml) and [`examples/provisioning/`](../provisioning/).

## Demo-only boundary

The demo passwords are plaintext values in source, and the session `Map` is lost when the process restarts or scales to another instance. These choices keep the example small and inspectable. They are not suitable for a deployed authentication system.

## Production checklist

Before adapting this flow for production:

- [ ] Replace the in-memory users and sessions with durable storage that supports expiration and revocation.
- [ ] Store passwords with a modern password hashing algorithm such as Argon2id or bcrypt. Never compare plaintext passwords.
- [ ] Add CSRF protection to sign-in, sign-out, and other state-changing routes.
- [ ] Add rate limiting and abuse controls to credential endpoints.
- [ ] Rotate the session after sign-in and privilege changes, and support explicit session rotation and revocation.
- [ ] Use secure, appropriately scoped cookies over HTTPS and enforce authorization for every protected route.
- [ ] Derive Grafana identity on the server, reject caller-supplied identity headers, and configure Grafana auth-proxy `whitelist` for trusted proxy egress.

## Important files

- `app/lib/session.ts` - demo users, in-memory sessions, expiration, and cleanup
- `app/api/auth/signin/route.ts` - demo sign-in endpoint
- `app/api/auth/signout/route.ts` - session deletion endpoint
- `app/api/auth/user/route.ts` - current-user endpoint
- `app/api/grafana/[...path]/route.ts` - session-validated Grafana proxy
- `app/dashboard/page.tsx` - embedded dashboard

## Teardown

Stop the application with `Ctrl+C`, then use the canonical stack commands from the repository root:

```bash
docker compose --project-directory examples -f examples/docker-compose.yml down
```

Add `-v` to reset the local Grafana volume:

```bash
docker compose --project-directory examples -f examples/docker-compose.yml down -v
```
