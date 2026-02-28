# SKL-012 Publication Decision

## Decision
- No-Go

## Reason
- Mandatory positive-path installability checks all failed (Case 1-3 in evidence):
  - `owner/repo`
  - `owner/repo/path`
  - `owner/repo@skill-name`
- Current evidence indicates cloned remote source still yields `No valid skills found. Skills require a SKILL.md with name and description.`

## Passed Checks
- Missing source argument fails as expected.
- Invalid remote subpath fails as expected.
- Nonexistent local path fails as expected.
- Project verification gate passes (`lint`, `typecheck`, `test:run`, `build`).

## Blocking Conditions
- Remote repository source currently does not yield a discoverable valid skill for `skills add owner/repo` forms.
- Publication gate cannot be flipped to Go while positive installability matrix is `0/3`.

## Required Follow-Up
1. Ensure finalized skill files are committed and available in remote paths recognized by skills discovery.
2. Ensure frontmatter remains valid (`name`, `description` are strings).
3. Re-run full installability harness (all 3 positive + 3 negative cases).
4. Flip decision to Go only after at least one mandatory positive case passes and no critical QA items remain unresolved.
