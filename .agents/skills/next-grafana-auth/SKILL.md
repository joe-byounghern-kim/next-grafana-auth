---
name: next-grafana-auth
description: Use when integrating or troubleshooting next-grafana-auth in a Next.js App Router application with Grafana auth-proxy, custom proxy paths, or server-side sessions.
---

# next-grafana-auth

## Requirements

- Next.js App Router, Next.js >= 15, React >= 18, Node >= 18.18, and Grafana >= 11.6.
- A server-side session or auth source that provides an email and a role mapped to `Admin`, `Editor`, or `Viewer`.
- A Next.js runtime that can reach Grafana at `GRAFANA_INTERNAL_URL` with Grafana auth-proxy enabled.

Use supported, patched versions that meet these compatibility floors. Repository contributor tooling and pinned example versions are separate from consuming application requirements. `GRAFANA_INTERNAL_URL` is the documented route convention. The library receives `grafanaUrl` explicitly.

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
- Keep Grafana private and use HTTPS plus an auth-proxy whitelist for trusted proxy egress in production.
- Preserve the application's existing auth system. Never copy hardcoded demo users into production routes.

## Known Limitations

- The default catch-all proxy route is `app/api/grafana/[...path]/route.ts`, with `/api/grafana` as the default proxy path.
- The skill does not implement an auth provider or replace Grafana hardening outside the auth-proxy configuration.
- The helper does not implement Grafana Live WebSocket upgrades. An iframe load event or successful health response does not prove identity, authorization, or dashboard rendering.
- See [references.md](references.md) for the package documentation and runnable examples.
