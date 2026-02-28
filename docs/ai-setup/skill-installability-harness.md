# SKL-007 Installability Harness

## Preconditions
- Clean test environment (no stale local skill state for this skill name).
- Network access for GitHub source checks.

## Positive-Path Assertions
1. `npx skills add joe-byounghern-kim/next-grafana-auth`
   - expected: exit code `0`
   - expected output includes successful install signal
   - expected discovery state includes `next-grafana-auth`
2. `npx skills add joe-byounghern-kim/next-grafana-auth/.agents/skills/next-grafana-auth`
   - expected: exit code `0`, valid discovery from subpath
3. `npx skills add joe-byounghern-kim/next-grafana-auth@next-grafana-auth`
   - expected: exact skill-name selection succeeds

## Negative-Path Assertions
1. `npx skills add`
   - expected: exit code non-zero, missing source error
2. `npx skills add joe-byounghern-kim/next-grafana-auth/non-existent`
   - expected: exit code non-zero, no valid skill discovered
3. `npx skills add ./definitely-not-a-skill-path`
   - expected: exit code non-zero, invalid/nonexistent local path

## Evidence Capture Schema
```
case: <id>
command: <full command>
exit_code: <number>
expected_tokens: <list>
observed_tokens: <list>
install_state: pass|fail
result: pass|fail
```

## Gate Rule
- No-Go if any mandatory positive-path fails.
- No-Go if any negative-path does not fail as expected.
