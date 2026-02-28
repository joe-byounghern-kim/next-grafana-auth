# Installability Success Contract for `skills add` (DOC-028)

## Supported Source Forms
- `owner/repo`
- `owner/repo/path/to/skill`
- `owner/repo@skill-name`
- `https://github.com/owner/repo` (including tree paths)
- GitLab URLs and compatible tree path forms
- local paths (`./`, `../`, absolute)
- direct `SKILL.md` URL

## Success Criteria
- Command exits with status `0`.
- Installed skill becomes discoverable by skill listing/lookup flow.
- Output contains successful installation signal.

## Failure Taxonomy
- source resolution failure (invalid source, missing local path)
- discovery failure (no valid skill documents found)
- metadata failure (invalid/missing required frontmatter)
- permission/network failure (remote fetch not accessible)

## Evidence Format
- executed command
- exit code
- key output lines
- observed install target
- pass/fail classification

## Go/No-Go Rule
- No-Go if mandatory positive-path source fails or if failure class cannot be deterministically identified.
