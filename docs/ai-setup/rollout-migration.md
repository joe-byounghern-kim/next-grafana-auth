# Rollout and Migration Plan

## Objective
- Migrate from oversized legacy docs to modular AI docs with low risk.

## Migration Order
1. Publish `docs/ai-setup` modules.
2. Add README handoff section and links.
3. Keep legacy docs as fallback references.
4. Validate links and dry-run scenarios.
5. Mark modular docs as primary for AI setup routing.

## Legacy to Modular Mapping
- `README.md` -> entry + handoff only.
- `GETTING_STARTED.md` -> background/reference; route setup logic to modular docs.
- `TROUBLESHOOTING.md` -> keep deep troubleshooting, route deterministic flow to playbooks.

## Cutover Policy
- Cutover requires `validation-harness.md` pass across representative scenarios.
- If validation fails, keep legacy routing and fix modular docs first.

## Acceptance Checklist
- All `docs/ai-setup/*.md` files exist and are <=150 lines.
- README handoff links resolve.
- Verification command set is documented and current.
- At least one successful dry run per auth branch.

## Post-Rollout Backlog
- Extend playbooks with additional failure signatures.
- Add CI automation for line-count and link checks.
- Add periodic docs drift checks against source/tests.

## Next Route
- Primary: `docs/ai-setup/readme-handoff-contract.md`
- Blocked path: `docs/ai-setup/troubleshooting-playbooks.md`
