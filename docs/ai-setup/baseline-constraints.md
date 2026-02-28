# Baseline and Constraints Inventory

## Objective
- Capture repository baseline and hard constraints before LLM setup execution.

## Baseline Sources
- `README.md`
- `GETTING_STARTED.md`
- `TROUBLESHOOTING.md`
- `examples/*/README.md`
- `src/index.ts`, `src/component.tsx`, `src/types.ts`, `src/utils.ts`
- `package.json`

## Setup Primitives
- Server proxy: `handleGrafanaProxy()` from `next-grafana-auth`.
- Client embed: `<GrafanaDashboard />` from `next-grafana-auth/component`.
- Verification scripts: `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run build`.

## Hard Constraints
- Modular docs only (no all-in-one playbook).
- Max 150 lines per document.
- Deterministic contracts: inputs, outputs, stop conditions, escalation path.
- Security invariants must match source behavior:
  - never trust inbound `X-WEBAUTH-*`.
  - never forward inbound `Authorization` or `Cookie`.

## V1 Non-Goals
- No runtime API redesign.
- No docs backend service or versioned portal.
- No undocumented command shortcuts that bypass verification.

## Ownership
- Maintainers own docs content and release alignment.
- Any setup behavior claim must trace to source code or tests.

## Exit Criteria
- Baseline sources and primitives are explicit.
- Constraints and non-goals are unambiguous.

## Next Route
- Primary: `docs/ai-setup/information-architecture.md`
- Blocked path: `docs/ai-setup/troubleshooting-playbooks.md`
