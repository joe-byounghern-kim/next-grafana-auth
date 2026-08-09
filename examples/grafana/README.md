# Canonical Grafana Example Stack

This guide owns the shared local Grafana stack used by the application examples and the sandbox. It is a development and validation stack, not a production deployment.

## Ownership and versions

- Compose file: [`examples/docker-compose.yml`](../docker-compose.yml)
- Provisioning root: [`examples/provisioning/`](../provisioning/)
- Current example image: `grafana/grafana:13.1.3`
- Host port: `3001`
- Grafana sub-path: `/api/grafana`
- Demo dashboard UID: `demo-dashboard`
- Demo datasource UID: `testdata`

Grafana `13.1.3` is the current repository example version. The published package support floor is Grafana `11.6`, which is a separate compatibility statement.

Do not add an application-local Compose or provisioning tree. Changes to the shared stack belong in `examples/docker-compose.yml` and `examples/provisioning/`.

## Prerequisites

- Docker with Docker Compose v2
- `curl`
- For the application workflows: Node.js `^22.22.2 || ^24.15.0 || >=26.0.0` and npm `12.0.2` or a newer npm 12 patch

The application examples use Next `16.3.0` and React `19.2.8`. Those are current example versions, not the consumer floors of Next 15 and React 18.

## Start and validate

Run these commands from the repository root. The first command validates the canonical Compose configuration without starting containers.

```bash
docker compose --project-directory examples -f examples/docker-compose.yml config --quiet
docker compose --project-directory examples -f examples/docker-compose.yml up -d
GRAFANA_BASE_URL=http://localhost:3001/api/grafana scripts/verify-grafana.sh
```

The verifier checks Grafana health, the `testdata` datasource, the `demo-dashboard` dashboard, and a TestData query response. A direct health check is:

```bash
curl -fsS http://localhost:3001/api/grafana/api/health
```

Run one of the application guides after the stack passes validation. The application should use its `/api/grafana` route instead of exposing Grafana directly to the browser.

## Auth-proxy and sub-path contract

The Compose file establishes the contract the examples expect:

| Setting | Local value | Purpose |
|---|---|---|
| `GF_SERVER_ROOT_URL` | `%(protocol)s://%(domain)s:%(http_port)s/api/grafana` | Grafana sub-path URL |
| `GF_SERVER_SERVE_FROM_SUB_PATH` | `true` | Serves Grafana below `/api/grafana` |
| `GF_SECURITY_ALLOW_EMBEDDING` | `true` | Allows the example iframe |
| `GF_AUTH_PROXY_ENABLED` | `true` | Enables auth-proxy |
| `GF_AUTH_PROXY_HEADER_NAME` | `X-WEBAUTH-USER` | Receives server-derived user identity |
| `GF_AUTH_PROXY_HEADERS` | `Role:X-WEBAUTH-ROLE` | Receives the mapped Grafana role |
| `GF_AUTH_PROXY_AUTO_SIGN_UP` | `true` | Creates local demo users automatically |
| `GF_AUTH_DISABLE_LOGIN_FORM` | `true` | Uses the proxy flow instead of Grafana login |

The local stack also uses development cookie settings. For production, keep Grafana behind a trusted proxy boundary, use HTTPS, and set `GF_AUTH_PROXY_WHITELIST` to the trusted proxy egress CIDRs or IPs. Do not expose this demo configuration without that boundary and whitelist.

## Canonical provisioning

The shared provisioning tree contains:

- `examples/provisioning/dashboards/dashboard.yml`
- `examples/provisioning/dashboards/json/demo-dashboard.json`
- `examples/provisioning/datasources/datasource.yml`

The dashboard uses Grafana's built-in TestData datasource, so validation does not require an external database.

## Logs and lifecycle

Inspect the Grafana container with Compose v2:

```bash
docker compose --project-directory examples -f examples/docker-compose.yml ps
docker compose --project-directory examples -f examples/docker-compose.yml logs --tail=100 grafana
```

Stop the stack and retain the provisioned data:

```bash
docker compose --project-directory examples -f examples/docker-compose.yml down
```

Stop the stack and reset the Grafana volume for a clean demo state:

```bash
docker compose --project-directory examples -f examples/docker-compose.yml down -v
```

For symptom-specific checks, use the repository [Troubleshooting guide](../../TROUBLESHOOTING.md) rather than duplicating its catalog here.
