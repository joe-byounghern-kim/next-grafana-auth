# SKL-008 Final Skill Structure Plan

## Core File (`SKILL.md`) Sections
1. Frontmatter (`name`, high-signal `description`)
2. Use when / do not use when
3. Quick path (deterministic basic setup)
4. Required invariants
5. Verification checklist
6. One-hop references

## Companion Files
- `workflow.md`: full basic setup details + verification commands
- `branches.md`: auth and topology branch selection matrix
- `troubleshooting.md`: symptom-based recovery map

## Line-Budget Targets
- `SKILL.md`: target 90-160 lines
- `workflow.md`: target <=180 lines
- `branches.md`: target <=140 lines
- `troubleshooting.md`: target <=180 lines

## Progressive Disclosure Rules
- Keep mandatory path in `SKILL.md` only.
- Move long examples and variant branches to companion files.
- Keep one-level references from core to companion files.

## Anti-Bloat Checks
- No duplicated API tables from `docs/API_REFERENCE.md`.
- No deep troubleshooting in core file.
- No branch ambiguity without explicit selector criteria.
