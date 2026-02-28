# Validation-First Loop and Evidence Contract (DOC-024)

## Standard Loop
1. Apply one scoped change.
2. Run deterministic validation.
3. Fix root cause on failure.
4. Re-run validation and record evidence.

## Required Evidence by Phase
- Structure checks: file existence, route links, dependency ordering.
- Quality checks: placeholder/TBD scan and contract conformance assertions.
- Project checks: `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run build`.

## Deterministic Gates
- Any failing verification command blocks completion.
- Any dependency-order violation blocks completion.
- Any ambiguous route without explicit blocked path blocks completion.

## Escalation Conditions
- Same failure persists after two retries with unchanged evidence.
- Required external dependency behavior cannot be verified from source or tests.

## Final Report Format
```
phase: <name>
change: <file + intent>
verification: <command + result>
status: pass|fail|blocked
```
