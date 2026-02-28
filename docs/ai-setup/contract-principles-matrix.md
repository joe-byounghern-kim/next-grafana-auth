# Contract Principles Matrix (DOC-020)

## Objective
- Map agentskills-aligned principles to this repository with mandatory/recommended/optional classification and explicit evidence.

## Matrix
| Principle | Repo concern | Level | Evidence requirement |
|---|---|---|---|
| Discovery metadata (`name`, `description`, intent) | `README.md`, `docs/ai-setup/readme-handoff-contract.md` | Mandatory | Reader can route from top-level doc to correct next contract without scanning deep docs |
| Progressive disclosure (summary first, details on demand) | `README.md`, `GETTING_STARTED.md`, `docs/ai-setup/*` | Mandatory | Top-level docs provide routing/constraints only; details live in referenced contracts |
| One-level references | `docs/ai-setup/information-architecture.md` | Mandatory | No required path exceeds one immediate reference step before actionable instruction |
| Trigger and anti-trigger semantics | `docs/ai-setup/contract-trigger-semantics.md` | Mandatory | Each route has explicit use and non-use cases with tie-break order |
| Validation-first loop | `docs/ai-setup/contract-validation-evidence.md` | Mandatory | Each phase defines command/evidence/gate before completion claim |
| Deterministic failure taxonomy | `TROUBLESHOOTING.md`, `docs/ai-setup/troubleshooting-playbooks.md` | Recommended | Failures are classed by symptom with reproducible checks/fixes |
| Installability acceptance contract | `docs/ai-setup/skills-add-installability-contract.md` | Mandatory | At least one successful `npx skills add` path and one negative case are asserted |
| Authoring line budgets and split rules | `docs/ai-setup/authoring-templates.md` | Recommended | File remains <=150 lines with no nested reference sprawl |

## Exit Evidence
- Contract matrix covers discovery, disclosure, references, trigger semantics, validation loop, and installability acceptance.
