---
name: next-grafana-auth
description: Use when integrating next-grafana-auth into a Next.js App Router application with Grafana auth-proxy.
---

# next-grafana-auth

## Requirements

- Next.js App Router, Next.js >= 15, React >= 18, Node >= 18.18, and Grafana >= 11.6.
- A server-side session or auth source that provides an email and a role mapped to `Admin`, `Editor`, or `Viewer`.
- A Next.js runtime that can reach Grafana at `GRAFANA_INTERNAL_URL` with Grafana auth-proxy enabled.

This skill does not apply to Pages Router applications, browser-derived identity, or Grafana deployments that cannot use auth-proxy.

## Install

```bash
npm install next-grafana-auth
```

## Integrate

1. Use [integration choices](branches.md) to select the identity source and Grafana URL for the deployment topology.
2. Follow [workflow.md](workflow.md) to add the proxy route, configure Grafana, embed the dashboard, and validate the result.
3. If a check fails, start with the matching symptom in [troubleshooting.md](troubleshooting.md).

## Security and path requirements

- Never trust inbound `X-WEBAUTH-*` headers from client traffic.
- Never forward inbound `Authorization` or `Cookie` headers to Grafana.
- Keep route path, `pathPrefix`, `baseUrl`, and Grafana `root_url` aligned.
- Map role only to `Admin | Editor | Viewer`.

## Known Limitations

- The default catch-all proxy route is `app/api/grafana/[...path]/route.ts`, with `/api/grafana` as the default proxy path.
- The skill does not implement an auth provider or replace Grafana hardening outside the auth-proxy configuration.
- See [references.md](references.md) for the package documentation and runnable examples.
