# Contributing Guide

Thanks for contributing to `next-grafana-auth`.

## Before you start

Read `README.md`, `SECURITY.md`, and `SUPPORT.md`. Keep pull requests focused on one logical change and avoid unrelated formatting or refactors.

## Development prerequisites

Contributor tooling requires Node.js `^22.22.2 || ^24.15.0 || >=26.0.0` and npm 12.0.2 or a newer compatible npm 12 patch.

The published consumer floor is separate: Node.js `>=18.18.0`.

## Required validation

Run the root checks in this order:

```bash
set -euo pipefail
npm ci
npm run typecheck
npm run lint
npm run test:run
npm run build
npm run smoke:dist
npm run smoke:component
npm run docs:check
npm audit --audit-level=high
npm pack --dry-run
```

The root build must complete before installing or building an application example. Validate the maintained application directories after the root checks:

```bash
set -euo pipefail
npm ci --prefix examples/basic
npm ci --prefix examples/nextauth
npm ci --prefix examples/custom-session
npm ci --prefix sandbox
npm run build --prefix examples/basic
npm run build --prefix examples/nextauth
npm run build --prefix examples/custom-session
npm run build --prefix sandbox
```

For the shared Grafana runtime smoke, use the commands in `examples/grafana/README.md` and `sandbox/README.md`.

## Code standards

- TypeScript strict mode is required.
- Do not use `any`, `@ts-ignore`, or `@ts-expect-error`.
- Follow existing patterns in `src/` and `tests/`.
- Keep public API changes intentional and documented.
- Preserve the proxy security invariants: server-derived identity, no inbound `X-WEBAUTH-*`, `Authorization`, or `Cookie` forwarding.

## Pull requests

Before requesting review:

- [ ] Required validation passes locally.
- [ ] Documentation reflects behavior changes.
- [ ] Breaking changes are clearly stated.
- [ ] Security-sensitive changes include rationale and tests.

## Reporting issues

Bug reports should include reproduction steps, Node.js, Next.js, and Grafana versions, expected versus actual behavior, and sanitized logs or screenshots. Feature requests should include the problem, proposed API or usage, and alternatives considered.

## Dependency maintenance

Routine Dependabot checks run monthly. Root tooling is grouped, and examples
and the sandbox share one update group. Each of the four update entries allows
one open version-update PR at a time. Major upgrades remain separate and require
compatibility review.

Review security fixes as they arrive. npm security updates use separate groups
and are not delayed by the monthly version-update schedule or its PR limits.

- If audits fail in unchanged directories, repair the shared baseline across all
  five lockfiles rather than disabling checks or merging a failing PR.
- Rebase remaining updates after the baseline lands. Close superseded PRs with a
  link to the replacement only after their fixes have merged.
- Require passing CI and security checks before merging. Check older green PRs
  again against the current base because advisory data changes over time.
- Do not auto-merge major upgrades or changes to authentication and proxy behavior.

Use npm and commit the affected `package-lock.json` files. Do not use
`npm audit fix --force` to bypass an incompatible upgrade.
