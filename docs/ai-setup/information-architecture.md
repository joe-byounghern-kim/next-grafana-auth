# Information Architecture and File Map

## Objective
- Define deterministic reading/navigation flow for AI setup docs.

## Module Map
- `baseline-constraints.md` - baseline, constraints, non-goals.
- `repository-recognition.md` - classify target repository.
- `setup-plan-generation.md` - build ordered setup plan.
- `execution-protocol.md` - safe execution and checkpointing.
- `troubleshooting-playbooks.md` - symptom-led recovery.
- `readme-handoff-contract.md` - README routing contract.
- `authoring-templates.md` - template and line-budget rules.
- `validation-harness.md` - quality and dry-run criteria.
- `rollout-migration.md` - migration and cutover policy.

## Deterministic Navigation Rules
1. Start from `README.md` handoff section.
2. Read `baseline-constraints.md` before any branch.
3. Always run `repository-recognition.md` before plan generation.
4. Run `execution-protocol.md` for any write/command action.
5. If blocked, route to `troubleshooting-playbooks.md`.

## Link Contract
- Each doc includes a `Next Route` section.
- Each doc names one primary next file and one blocked-path file.
- No circular primary route links.

## Naming Convention
- Lowercase kebab-case filenames.
- One topic per file.
- Title starts with behavior domain, not implementation detail.

## Exit Criteria
- File map is complete and non-overlapping.
- Navigation is deterministic for autonomous readers.

## Next Route
- Primary: `docs/ai-setup/repository-recognition.md`
- Blocked path: `docs/ai-setup/troubleshooting-playbooks.md`
