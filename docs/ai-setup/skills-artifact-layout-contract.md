# Skill Artifact and Metadata Layout Contract (DOC-029)

## Required Artifact Layout
- Required file: `SKILL.md`.
- Allowed roots: repository root skill directory or explicit subpath selected by source parser.

## Mandatory Frontmatter
- `name`: non-empty string.
- `description`: non-empty string including intent trigger language.

## Optional Metadata
- Optional fields may be present but must not break discovery.
- Internal-only skills must be explicitly gated by environment/selection policy.

## Packaging Expectations
- Distributable source must include `SKILL.md` and required frontmatter unchanged.
- No packaging step may strip frontmatter required for parser validation.

## Pre-Validation Checklist
1. `SKILL.md` exists.
2. Required frontmatter fields exist and are string-typed.
3. Source path resolves to expected skill directory/file.
