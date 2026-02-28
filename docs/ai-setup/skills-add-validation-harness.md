# Deterministic `skills add` Validation Harness (DOC-031)

## Preconditions
- clean workspace for test artifacts
- network access for remote source tests
- reproducible runtime with command logging enabled

## Positive Path Checks
- `npx skills add owner/repo`
- `npx skills add ./local-path`

At least one positive path is mandatory for release gating.

## Negative Path Checks
- missing source argument
- nonexistent local path
- source with no valid `SKILL.md`

## Deterministic Assertions
- exit code matches expected pass/fail.
- output contains expected success/failure token.
- installed location (or absence) matches expected state.

## Evidence Record
- command
- exit code
- key output excerpts
- assertion outcome
