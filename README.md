# next-grafana-auth

[![license](https://img.shields.io/npm/l/next-grafana-auth)](https://github.com/joe-byounghern-kim/next-grafana-auth/blob/main/LICENSE)

Embed Grafana dashboards in Next.js with Grafana auth-proxy. This package keeps runtime deps at zero (peer deps only) and targets Next.js 15+.

## TL;DR

- Server side: proxy Grafana requests with `handleGrafanaProxy()`.
- Client side: embed dashboards with `<GrafanaDashboard />`.
- Fastest validation path: [sandbox/README.md](./sandbox/README.md).
- Full integration guide: [GETTING_STARTED.md](./GETTING_STARTED.md).

## Critical Defaults (Do Not Skip)

1. Use `/api/grafana/[...path]/route.ts` as the default route.
2. Keep `pathPrefix` and Grafana `root_url` aligned (default: `/api/grafana`).
3. Set `GRAFANA_INTERNAL_URL` by topology:
   - Host-run Next.js + Docker Grafana: `http://localhost:3001`
   - Next.js + Grafana on same Docker network: `http://grafana:3000`
4. Configure Grafana auth proxy with trusted upstream headers:

```ini
[auth.proxy]
enabled = true
header_name = X-WEBAUTH-USER
header_property = username
headers = Role:X-WEBAUTH-ROLE
enable_login_token = true
# Production: set whitelist to trusted proxy egress CIDRs/IPs.
```

## Install

```bash
npm install next-grafana-auth
```

AI skill setup (optional):

```bash
npx skills add joe-byounghern-kim/next-grafana-auth
```

Local tarball evaluation:

```bash
npm pack
npm install ./next-grafana-auth-1.0.0.tgz
```

## Quick Start Paths

| Goal | Time | Path |
|---|---:|---|
| Evaluate in 5 minutes | 5 min | [sandbox/README.md](./sandbox/README.md) |
| Integrate in existing app | 15 min | [GETTING_STARTED.md](./GETTING_STARTED.md) |
| Auth-specific implementation | 30-45 min | [examples/README.md](./examples/README.md) |

For setup branches (sandbox/basic/NextAuth/custom), start at [GETTING_STARTED.md](./GETTING_STARTED.md).

## LLM Reading Order (Deterministic)

- Quick evaluation: [sandbox/README.md](./sandbox/README.md) -> [docs/ai-setup/execution-protocol.md](./docs/ai-setup/execution-protocol.md)
- Full integration: [docs/ai-setup/baseline-constraints.md](./docs/ai-setup/baseline-constraints.md) -> [docs/ai-setup/information-architecture.md](./docs/ai-setup/information-architecture.md) -> [docs/ai-setup/repository-recognition.md](./docs/ai-setup/repository-recognition.md) -> [docs/ai-setup/setup-plan-generation.md](./docs/ai-setup/setup-plan-generation.md)
- Troubleshooting: [docs/ai-setup/troubleshooting-playbooks.md](./docs/ai-setup/troubleshooting-playbooks.md)
- Authoring and validation: [docs/ai-setup/authoring-templates.md](./docs/ai-setup/authoring-templates.md) -> [docs/ai-setup/validation-harness.md](./docs/ai-setup/validation-harness.md)

## Security Invariants

- Never trust inbound `X-WEBAUTH-*` from client requests.
- Never forward inbound `Authorization` or `Cookie` headers to Grafana.
- Derive `userEmail` and `userRole` from your server auth/session source only.
- Restrict role mapping to Grafana roles (`Admin`, `Editor`, `Viewer`).
- `authToken` in URL params is visible in logs/history/referrer; prefer session-cookie auth-proxy flow.
- In production Grafana, configure auth-proxy `whitelist` to trusted proxy CIDRs/IPs.

## API and Configuration References

- Full API reference: [docs/API_REFERENCE.md](./docs/API_REFERENCE.md)
- Integration paths: [GETTING_STARTED.md](./GETTING_STARTED.md)
- Troubleshooting: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- AI setup contracts: [docs/ai-setup/README.md](./docs/ai-setup/README.md)

## Troubleshooting

If setup fails, start with [TROUBLESHOOTING.md](./TROUBLESHOOTING.md). Most issues are one of:

- Route mismatch (`/api/grafana/[...path]` vs custom route without matching `pathPrefix`/`root_url`)
- Wrong `GRAFANA_INTERNAL_URL` for current topology
- Grafana auth-proxy config mismatch (`header_name`, role header mapping, cookie/sub-path settings)

## Requirements

- Node.js >= 18.18.0
- Next.js >= 15.0.0
- React >= 18.0.0
- Grafana 11.6+

## Resources

- Quick eval: [sandbox/README.md](./sandbox/README.md)
- Examples: [examples/README.md](./examples/README.md)
- Support policy: [SUPPORT.md](./SUPPORT.md)
- Security policy: [SECURITY.md](./SECURITY.md)
- Report bugs: [GitHub Issues](https://github.com/joe-byounghern-kim/next-grafana-auth/issues)

## License

MIT License - see [LICENSE](./LICENSE).
