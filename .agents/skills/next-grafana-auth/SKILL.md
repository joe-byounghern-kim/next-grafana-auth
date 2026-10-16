---
name: next-grafana-auth
description: Use when you need to embed a Grafana dashboard in Next.js App Router, configure a Grafana auth proxy or X-WEBAUTH-USER, fix an iframe shows the Grafana login page symptom or /api/grafana 404/504, or are upgrading next-grafana-auth. Covers existing server-side sessions and custom proxy paths. Not for Pages Router, Grafana deployments that can't enable auth-proxy, or building a new auth provider.
---

# next-grafana-auth

## Check the version first

Run `npm ls next-grafana-auth` in the consuming app before choosing APIs. If absent, install with `npm install next-grafana-auth`, then check again. This skill follows repository `main`, which can be ahead of npm. When the installed release differs from main, consult the matching `vX.Y.Z` tag's docs and changelog using [references.md](references.md), not unversioned examples. Do not silently upgrade the app.

## Requirements

- Next.js App Router, Next.js >= 15, React >= 18, Node >= 18.18, and Grafana >= 11.6. Use supported, patched versions meeting these consumer floors, not the repository contributor toolchain.
- An existing server-side session/auth source providing an email and a role mapped to `Admin`, `Editor`, or `Viewer`.
- A Next.js runtime that can reach Grafana with auth-proxy enabled. `GRAFANA_INTERNAL_URL` is a route convention passed explicitly as `grafanaUrl`, not an environment variable read by the library.

Non-goals: Pages Router, browser-derived identity, Grafana deployments that cannot enable auth-proxy, and building or replacing an auth provider.

## Integrate or diagnose

1. Choose identity, topology, and one proxy path in [branches.md](branches.md).
2. Follow [workflow.md](workflow.md), using its linked copyable route, client component, and Grafana templates.
3. Use [troubleshooting.md](troubleshooting.md) for status ownership, login pages, 404/504, and Live limitations.
4. For 1.0.x consumers, read [the upgrade path](workflow.md#upgrading-from-10x) before changing versions.

## Security and validation

- Derive identity only from the existing server session. Reject missing/invalid sessions before calling the proxy. Never copy demo users.
- Never trust inbound `X-WEBAUTH-*` or forward inbound `Authorization`/`Cookie` to Grafana.
- Align route path, `pathPrefix`, component `baseUrl`, and Grafana public `root_url`. Keep Grafana private, with HTTPS and a narrow trusted-egress auth-proxy whitelist in production.
- Grafana Live WebSocket upgrades are unsupported. An iframe load event or health response proves neither identity, authorization, nor panel rendering. Report only checks actually performed.
