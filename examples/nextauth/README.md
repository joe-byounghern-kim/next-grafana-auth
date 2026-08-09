# NextAuth Example

The NextAuth example uses a credentials provider, a JWT session, and server-side role mapping around `next-grafana-auth`. Its users and passwords are local demo data, not a production authentication system.

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
npm ci --prefix examples/nextauth
cp examples/nextauth/.env.example examples/nextauth/.env
NEXTAUTH_SECRET="$(openssl rand -base64 32)" npm run dev --prefix examples/nextauth
```

The final command supplies a generated development secret noninteractively and overrides the placeholder in `.env` for that process. For a stable local secret across restarts, replace the placeholder in `.env` once instead.

The development server listens on `http://localhost:3000`.

## Demo flow

1. Open [`http://localhost:3000/signin`](http://localhost:3000/signin).
2. Use one of the local demo accounts:

   | Email | Password | Grafana role |
   |---|---|---|
   | `admin@example.com` | `admin123` | Admin |
   | `user@example.com` | `user123` | Viewer |

3. Open [`http://localhost:3000/dashboard`](http://localhost:3000/dashboard).
4. Use **Sign Out** to end the NextAuth session.

The dashboard checks `/api/grafana/api/health` after authentication and embeds `demo-dashboard` through the `/api/grafana` proxy.

## What this example demonstrates

- `app/api/auth/[...nextauth]/route.ts` exposes the NextAuth handlers configured in `app/lib/auth.ts`.
- The credentials provider validates the local demo users and stores email, name, and role in a JWT session.
- `app/api/grafana/[...path]/route.ts` calls `getServerSession`, maps the session role, and passes the server-derived identity to `handleGrafanaProxy` with `(await params).path`.
- `app/dashboard/page.tsx` imports `GrafanaDashboard` from `next-grafana-auth/component` and uses `/api/grafana` as its base URL.
- `GRAFANA_INTERNAL_URL` defaults to `http://localhost:3001` for a host-run Next.js process. Use `http://grafana:3000` only when the application itself runs inside the shared Compose network.

The shared Grafana stack and provisioning are owned by [`examples/docker-compose.yml`](../docker-compose.yml) and [`examples/provisioning/`](../provisioning/).

## Demo-only boundary

The credentials provider reads a small in-memory user object with demo passwords. This keeps the example self-contained, but it does not provide a user database, password hashing, operational controls, or a complete provider deployment.

## Production checklist

Before adapting this flow for production:

- [ ] Use a real identity provider or a properly designed credential system backed by durable user storage.
- [ ] Hash passwords with a modern password hashing algorithm if credentials are retained; never store plaintext passwords.
- [ ] Set a strong secret through deployment secret management, use HTTPS, and configure secure cookie behavior.
- [ ] Protect sign-in and other state-changing actions with CSRF controls and rate limiting.
- [ ] Validate authorization and role mapping on the server for every Grafana request.
- [ ] Do not accept caller-supplied identity, `Authorization`, or `Cookie` headers as Grafana credentials.
- [ ] Configure Grafana auth-proxy `whitelist` for trusted proxy egress and keep `GRAFANA_INTERNAL_URL` server-side.

## Important files

- `app/lib/auth.ts` - demo credentials provider, JWT callbacks, and role mapping
- `app/api/auth/[...nextauth]/route.ts` - NextAuth route handlers
- `app/api/grafana/[...path]/route.ts` - server-session-validated Grafana proxy
- `app/signin/page.tsx` - demo sign-in page
- `app/dashboard/page.tsx` - authenticated embedded dashboard

## Teardown

Stop the application with `Ctrl+C`, then use the canonical stack commands from the repository root:

```bash
docker compose --project-directory examples -f examples/docker-compose.yml down
```

Add `-v` to reset the local Grafana volume:

```bash
docker compose --project-directory examples -f examples/docker-compose.yml down -v
```
