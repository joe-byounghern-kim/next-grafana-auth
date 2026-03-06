# Local Grafana Test Instance

Use this guide to run the shared Grafana stack for the example apps in `examples/`.

## What This Provides

The Docker Compose stack in `examples/docker-compose.yml` starts Grafana with:

- auth-proxy enabled for `next-grafana-auth`
- sub-path routing at `/api/grafana`
- iframe embedding enabled
- auto sign-up for demo users
- a provisioned `demo-dashboard` backed by Grafana's built-in TestData datasource

## Prerequisites

- Docker
- Node.js >= 18.18.0 for the example app you plan to run
- One of the example guides:
  - [Basic](../basic/README.md)
  - [NextAuth.js](../nextauth/README.md)
  - [Custom session](../custom-session/README.md)

## Quick Start

From the repository root:

```bash
cd examples
docker compose up -d
```

Verify Grafana is healthy:

```bash
curl http://localhost:3001/api/health
```

Stop the stack:

```bash
cd examples
docker compose down
```

Remove persisted data too:

```bash
cd examples
docker compose down -v
```

## Shared Configuration

| Variable | Value | Description |
|---|---|---|
| `GF_SERVER_ROOT_URL` | `%(protocol)s://%(domain)s:%(http_port)s/api/grafana` | Grafana sub-path contract |
| `GF_SERVER_SERVE_FROM_SUB_PATH` | `true` | Enables `/api/grafana` routing |
| `GF_SECURITY_ALLOW_EMBEDDING` | `true` | Allows iframe embedding |
| `GF_AUTH_PROXY_ENABLED` | `true` | Enables auth-proxy |
| `GF_AUTH_PROXY_HEADER_NAME` | `X-WEBAUTH-USER` | Trusted user identity header |
| `GF_AUTH_PROXY_HEADER_PROPERTY` | `username` | User property mapping |
| `GF_AUTH_PROXY_AUTO_SIGN_UP` | `true` | Auto-creates demo users |
| `GF_AUTH_PROXY_ENABLE_LOGIN_TOKEN` | `true` | Enables login token flow |
| `GF_AUTH_DISABLE_LOGIN_FORM` | `true` | Forces proxy auth instead of Grafana login UI |

Provisioning assets live under [`examples/provisioning/`](../provisioning/):

- `dashboards/dashboard.yml`
- `dashboards/json/demo-dashboard.json`
- `datasources/datasource.yml`

## Access Pattern

Do not browse Grafana directly as your primary validation path. Start one of the example apps and access Grafana through that app's proxy route:

- Basic example: `http://localhost:3000/dashboard`
- NextAuth example: `http://localhost:3000/dashboard`
- Custom session example: `http://localhost:3000/dashboard`

The proxy should reach Grafana at `http://localhost:3001` for host-run Next.js processes.

## Troubleshooting

### Grafana will not start

```bash
cd examples
docker compose logs grafana
docker compose ps
```

Common causes:
- port `3001` already in use
- Docker resource limits
- stale local Grafana volume state

### Example app cannot reach Grafana

```bash
curl http://localhost:3001/api/health
```

Then confirm the example app uses:

```bash
GRAFANA_INTERNAL_URL=http://localhost:3001
```

### Dashboard or datasource looks wrong

The example stack expects the provisioned dashboard and datasource files in `examples/provisioning/`. If you customize them, restart Grafana:

```bash
cd examples
docker compose down
docker compose up -d
```

## Customization

- Edit `examples/provisioning/dashboards/json/demo-dashboard.json` to change the demo dashboard.
- Edit `examples/provisioning/datasources/datasource.yml` to change the datasource setup.
- Change the Grafana image tag in `examples/docker-compose.yml` if you need to test another Grafana version.

## Security Note

This Compose stack is for local development and validation. For production deployments, keep Grafana behind your trusted proxy boundary, enable HTTPS, and configure auth-proxy `whitelist` to trusted proxy egress CIDRs/IPs.
