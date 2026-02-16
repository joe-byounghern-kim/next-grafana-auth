# Contributing Guide

Thanks for your interest in contributing to `next-grafana-auth`.

## Before You Start

- Read `README.md` for project context.
- Read `SECURITY.md` for vulnerability reporting.
- For questions and triage, use `SUPPORT.md`.

## Development Setup

```bash
npm ci
npm run typecheck
npm run test:run
npm run build
```

Node requirement: `>=18.18.0`.

## Branching and PR Scope

- Keep changes small and focused.
- One logical change per pull request.
- Avoid unrelated formatting or refactors.

## Code Standards

- TypeScript strict mode is required.
- Do not use `any`, `@ts-ignore`, or `@ts-expect-error`.
- Follow existing patterns in `src/` and `tests/`.
- Keep public API changes intentional and documented.

## Testing Requirements

Run all checks locally before opening a PR:

```bash
npm run typecheck && npm run test:run && npm run build && npm run lint
```

Validate examples and sandbox still build:

```bash
npm run build --prefix examples/basic && npm run build --prefix examples/nextauth && npm run build --prefix examples/custom-session && npm run build --prefix sandbox
```

Targeted test commands:

```bash
npx vitest run tests/handler.test.ts
npx vitest run tests/component.test.tsx
```

## Commit Messages

Use clear, imperative commit messages, for example:

- `fix proxy header forwarding regression`
- `add release tag/version verification`
- `update docs for production-safe auth snippets`

## Pull Request Checklist

Before requesting review:

- [ ] Tests and checks pass locally
- [ ] Documentation updated where behavior changed
- [ ] No breaking changes unless clearly stated
- [ ] Security-sensitive changes include rationale and tests

## Reporting Bugs

Use the bug report template and include:

- Reproduction steps
- Environment details (Node, Next.js, Grafana)
- Expected vs actual behavior
- Relevant logs or screenshots

## Feature Requests

Use the feature request template and include:

- Problem statement
- Proposed API/usage
- Alternatives considered
