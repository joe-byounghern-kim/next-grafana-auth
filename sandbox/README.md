# next-grafana-auth Sandbox

The sandbox is a quick end-to-end evaluation app for `next-grafana-auth`. It owns the sandbox Next.js app and `quick-start.sh`; Grafana Compose and provisioning are owned by `examples/`.

This is a local demo workflow, not a production authentication or deployment template.

## Prerequisites

Run the script from the repository root with:

- Node.js `^22.22.2 || ^24.15.0 || >=26.0.0`
- npm `12.0.2` or a newer npm 12 patch
- Docker with Docker Compose v2
- `curl`

The root package build uses the contributor toolchain above. The published package's consumer Node.js floor is 18.18, which is a separate compatibility statement.

## Quick start

From the repository root:

```bash
./sandbox/quick-start.sh
```

The script builds the root package, installs the sandbox, creates `sandbox/.env` from `sandbox/.env.example` when needed, starts the canonical Grafana stack, validates it, and starts the sandbox development server at `http://localhost:3000`.

By default, the script resets the canonical Grafana volume before starting. Keep existing Grafana data instead:

```bash
KEEP_GRAFANA_DATA=1 ./sandbox/quick-start.sh
```

For the scripted build-and-start validation path, use:

```bash
QUICK_START_VERIFY_ONLY=1 ./sandbox/quick-start.sh
```

## What quick-start validates

`quick-start.sh` validates the same boundaries used by the repository workflow:

1. Node.js, npm, Docker, Docker Compose v2, and `curl` are available.
2. The root package passes `npm ci` and `npm run build`.
3. The sandbox dependencies install with `npm ci`.
4. The canonical stack in `examples/docker-compose.yml` starts.
5. `scripts/verify-grafana.sh` checks the `/api/grafana` health endpoint, the `testdata` datasource, the `demo-dashboard` dashboard, and a TestData query response.
6. The sandbox app starts and serves its proxy and dashboard checks when verification mode is enabled.

The sandbox route uses a local demo identity. It does not ask Grafana users to configure a separate local infrastructure tree.

## Manual validation

With the quick-start process running, open:

- [`http://localhost:3000`](http://localhost:3000) - sandbox home page
- [`http://localhost:3000/dashboard`](http://localhost:3000/dashboard) - embedded demo dashboard

From the repository root, validate the canonical stack directly:

```bash
curl -fsS http://localhost:3001/api/grafana/api/health
GRAFANA_BASE_URL=http://localhost:3001/api/grafana scripts/verify-grafana.sh
```

The sandbox uses `GRAFANA_INTERNAL_URL=http://localhost:3001` for a host-run Next.js process. The shared Grafana stack and its provisioning files are documented in [examples/grafana/README.md](../examples/grafana/README.md).

## Teardown and data reset

Stop the sandbox development server with `Ctrl+C`. Then stop the canonical Grafana stack from the repository root:

```bash
docker compose --project-directory examples -f examples/docker-compose.yml down
```

To remove the persisted Grafana data and return to a clean demo state:

```bash
docker compose --project-directory examples -f examples/docker-compose.yml down -v
```

## Production boundary

The sandbox proxy uses a hardcoded local demo user and is intended for evaluation only. Before adapting it for production, derive identity from a server-side auth system, enforce role authorization, reject caller-supplied identity and credential headers, keep Grafana private behind a trusted proxy, use HTTPS, and configure the Grafana auth-proxy `whitelist`.

For application patterns, use the [Basic](../examples/basic/README.md), [NextAuth](../examples/nextauth/README.md), or [Custom Session](../examples/custom-session/README.md) guides. For symptom-specific checks, use the repository [Troubleshooting guide](../TROUBLESHOOTING.md).
