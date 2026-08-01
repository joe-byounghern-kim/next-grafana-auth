# Examples Index

This directory contains runnable integration examples for `next-grafana-auth` plus a shared local Grafana stack.

## Start Here

1. Start the shared Grafana test instance: [examples/grafana/README.md](./grafana/README.md)
2. Choose the example that matches your auth/session model.
3. Run the example-specific setup guide.

## Choose an Example

| Example | Best when | Auth source | Guide |
|---|---|---|---|
| Basic | You want the smallest possible embedding example | Hardcoded demo user | [examples/basic/README.md](./basic/README.md) |
| NextAuth.js | You already use NextAuth session primitives | NextAuth session | [examples/nextauth/README.md](./nextauth/README.md) |
| Custom session | You own cookie/session storage and validation | Custom server session | [examples/custom-session/README.md](./custom-session/README.md) |

## Shared Defaults

- Shared Grafana URL for host-run Next.js examples: `http://localhost:3001`
- Shared proxy base path: `/api/grafana`
- Shared demo dashboard UID: `demo-dashboard`
- Shared Grafana provisioning guide: [examples/grafana/README.md](./grafana/README.md)

## Related Paths

- Root integration guide: [GETTING_STARTED.md](../GETTING_STARTED.md)
- Sandbox quick evaluation: [sandbox/README.md](../sandbox/README.md)
- Troubleshooting: [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)
