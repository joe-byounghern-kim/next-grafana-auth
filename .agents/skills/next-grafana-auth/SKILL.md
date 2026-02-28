---
name: next-grafana-auth
description: Use when a Next.js app needs Grafana embedding through auth-proxy. Provides deterministic branch selection, secure proxy invariants, and binary verification checks.
---

# next-grafana-auth

## FIRST: Confirm This Skill Applies
- Project uses Next.js App Router (`app/` present).
- Project proxies Grafana through a catch-all route (default: `app/api/grafana/[...path]/route.ts`).
- Server can derive trusted user identity (`email`, `role`) from session/auth.

## Portability Envelope (Supported Context)
- Next.js >= 15, React >= 18, Node >= 18.18, Grafana >= 11.6.
- Auth source can return `userEmail` and role mapped to `Admin | Editor | Viewer`.
- Runtime can reach Grafana via `GRAFANA_INTERNAL_URL`.

## Stop And Switch (Unsupported Context)
- Not Next.js App Router.
- No server-side trusted identity source.
- Grafana auth-proxy cannot be enabled.

If any stop condition is true, do not continue with this skill.

## Outcome
After execution, the project has:
- deterministic auth/topology branch decisions,
- a secure proxy route and dashboard embed path,
- binary verification evidence for health and render checks.

## Quick Reference
| File | Purpose |
|---|---|
| `branches.md` | pick auth/topology branches deterministically |
| `workflow.md` | execute Phases 0-5 with binary checks |
| `troubleshooting.md` | resolve first failing check |
| `references.md` | runtime docs/examples and optional deep references |

## Core Path (Do In Order)
1. Choose auth and topology branches using `branches.md` decision table.
2. Execute `workflow.md` Phases 0-5 as the single authoritative implementation path.
3. Stop on first failing check and switch to `troubleshooting.md`.

## Canonical Security Contract (Source of Truth)
- Never trust inbound `X-WEBAUTH-*` headers from client traffic.
- Never forward inbound `Authorization` or `Cookie` headers to Grafana.
- Keep route path, `pathPrefix`, `baseUrl`, and Grafana `root_url` aligned.
- Map role only to `Admin | Editor | Viewer`.

All companion files reference this contract and must not redefine conflicting rules.

## Known Limitations
- This skill assumes App Router catch-all proxy routing with aligned base path (default `/api/grafana`).
- It does not define user-auth provider internals; branch files provide routing only.
- It does not replace Grafana server hardening outside auth-proxy scope.

## Anti-Patterns
- Do not proxy Grafana directly from client without server identity derivation.
- Do not bypass your chosen proxy base path contract (default `/api/grafana`) unless all aligned prefixes are updated.
- Do not treat unauthenticated health checks as proof of successful integration.

## If Blocked
- Follow first-failing-check flow in `troubleshooting.md`.
- Capture the exact failing check output before escalating.

## Reference Files (One Hop)
- `workflow.md` - phased implementation and binary checks.
- `branches.md` - deterministic branch decision table.
- `troubleshooting.md` - symptom-first recovery flow.
- `references.md` - runtime examples and optional deep references.
