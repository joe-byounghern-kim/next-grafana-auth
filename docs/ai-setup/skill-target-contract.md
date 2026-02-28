# SKL-003 Target Skill Contract

## Frontmatter Contract
- Required:
  - `name: next-grafana-auth`
  - `description: ...` with clear trigger intent
- Description must include when-to-use signal and domain keywords (Next.js, Grafana, auth-proxy).

## Concise-Core Contract
- Core file must contain:
  - trigger and anti-trigger
  - basic setup flow
  - deterministic verification checklist
  - one-level links to detail docs

## Anti-Bloat Rules
- Keep core focused on mandatory path and decisions.
- Move deep examples and long troubleshooting to one-hop companion files.
- Avoid duplicate API tables already present in repository docs.

## One-Level References
- Allowed: `SKILL.md` -> `workflow.md|branches.md|troubleshooting.md`
- Not allowed: mandatory guidance hidden behind deeper chains.
