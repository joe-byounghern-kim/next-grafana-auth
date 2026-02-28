# AI Setup Docs

## Objective
- Provide deterministic, modular instructions for LLM-driven setup with `next-grafana-auth`.

## Read First
1. `docs/ai-setup/baseline-constraints.md`
2. `docs/ai-setup/information-architecture.md`
3. `docs/ai-setup/repository-recognition.md`
4. `docs/ai-setup/setup-plan-generation.md`
5. `docs/ai-setup/execution-protocol.md`
6. `docs/ai-setup/troubleshooting-playbooks.md` (only when blocked)

## Contracts
- One topic per file.
- Each file must stay at or below 150 lines.
- Each procedural document includes explicit expected evidence.
- Stop immediately on explicit block conditions.

## Inputs
- `package.json`, lockfile, app route structure, env files, and auth/session implementation.

## Outputs
- Compatibility verdict.
- Ordered setup plan.
- Verified execution log.
- Troubleshooting outcome or escalation note.

## Links
- Templates: `docs/ai-setup/authoring-templates.md`
- Validation: `docs/ai-setup/validation-harness.md`
- Rollout: `docs/ai-setup/rollout-migration.md`
- README contract: `docs/ai-setup/readme-handoff-contract.md`

## Next Route
- Primary: `docs/ai-setup/baseline-constraints.md`
- Blocked path: `docs/ai-setup/troubleshooting-playbooks.md`
