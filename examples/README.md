# Examples

Runnable Next.js integration examples and the canonical local Grafana stack for `next-grafana-auth`.

## Requirements and versions

The clean-clone and contributor workflow builds the root package before installing an application example. Use:

- Node.js `^22.22.2 || ^24.15.0 || >=26.0.0`
- npm `12.0.2` or a newer npm 12 patch
- Docker with Docker Compose v2
- `curl` for the verification scripts

These are repository workflow requirements, not the published package's consumer floors. The published compatibility floors are Node.js 18.18, Next 15, React 18, and Grafana 11.6.

The current repository examples use Next `16.3.0`, React `19.2.8`, and Grafana `13.1.3`. The Grafana version is the current example image, not the Grafana support floor.

## Shared Grafana stack

Every application example uses the canonical stack in [`examples/docker-compose.yml`](./docker-compose.yml). Its provisioning files live in [`examples/provisioning/`](./provisioning/). The [Grafana guide](./grafana/README.md) owns stack startup, validation, logs, stop, and volume-reset commands.

The examples do not have application-local Compose or provisioning trees. Run the shared stack from the repository root, then run the application-specific workflow below.

## Choose an example

| Example | Use it when | Identity source | Guide |
|---|---|---|---|
| Basic | You need the smallest embedding demonstration | Hardcoded local demo user | [Basic](./basic/README.md) |
| NextAuth | Your application uses NextAuth session primitives | NextAuth credentials-provider session | [NextAuth](./nextauth/README.md) |
| Custom Session | You own cookie and session validation | Custom cookie session with a local in-memory store | [Custom Session](./custom-session/README.md) |
| Sandbox | You want a quick end-to-end package evaluation | Hardcoded local demo user | [Sandbox](../sandbox/README.md) |

## Shared defaults

- Host-run examples reach Grafana at `http://localhost:3001` through `GRAFANA_INTERNAL_URL`.
- The proxy base path is `/api/grafana`.
- The provisioned dashboard UID is `demo-dashboard`.
- The verifier reaches the canonical Grafana route at `http://localhost:3001/api/grafana`.

Start with the guide for the example you want. Each application guide contains the exact clean-clone command block, demo flow, production boundary, and links to canonical Grafana teardown.

## Related documentation

- [Getting Started](../GETTING_STARTED.md)
- [API Reference](../docs/API_REFERENCE.md)
- [Grafana stack guide](./grafana/README.md)
- [Sandbox](../sandbox/README.md)
- [Troubleshooting](../TROUBLESHOOTING.md)
