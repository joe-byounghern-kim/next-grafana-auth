# SKL-001 Baseline and Constraints Inventory

## Objective
Capture the current skill baseline and non-negotiable constraints before finalization.

## Current Skill State
- File: `.agents/skills/next-grafana-auth/SKILL.md`
- Current size: 230 lines (high context load for first pass)
- Current strengths: concrete route/component examples, auth variants, troubleshooting cues
- Current issues: missing anti-triggers, mixed core/optional content, step-count inconsistency

## Mandatory Repository Constraints
- Preserve trusted-header model (`X-WEBAUTH-USER`/`X-WEBAUTH-ROLE` are server-derived).
- Preserve forwarding bans (`Authorization` and `Cookie` never proxied upstream).
- Keep route/prefix/root_url alignment explicit (`/api/grafana` default contract).
- Keep topology-dependent `GRAFANA_INTERNAL_URL` guidance explicit.

## Installability Constraints (`npx skills add`)
- Source `owner/repo` must discover at least one valid `SKILL.md`.
- `SKILL.md` frontmatter must include string `name` and `description`.
- Skill should remain discoverable in `.agents/skills/next-grafana-auth/SKILL.md`.

## Evidence
- `README.md`, `GETTING_STARTED.md`, `TROUBLESHOOTING.md`, `docs/API_REFERENCE.md`
- `src/index.ts` security and validation logic
- external skills parser contract (owner/repo + frontmatter requirements)
