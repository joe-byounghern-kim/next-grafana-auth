# Execution Protocol and Command Safety

## Objective
- Execute setup safely with deterministic checkpoints and minimal destructive risk.

## Execution Loop
1. Read local context for the current phase.
2. Apply one scoped change.
3. Verify with diagnostics/tests.
4. Record evidence and proceed.

## Allowed Commands
- `npm run lint`
- `npm run typecheck`
- `npm run test:run`
- `npm run build`

## Caution Commands
- `npm run test` (watch mode) only for interactive sessions.
- Docker/network commands only when environment ownership is clear.

## Forbidden Commands
- Destructive git operations (`reset --hard`, force push, etc.).
- Secrets exfiltration or echoing credentials.
- Bypassing verification gates.

## Checkpoint Format
```text
phase: <name>
change: <file + intent>
verification: <command + result>
status: pass|fail|blocked
```

## Retry Policy
- Retry transient network failures up to 2 times.
- If still failing, switch to troubleshooting playbook.

## Rollback Guidance
- Revert only local uncommitted changes introduced in the failing step.
- Preserve unrelated user modifications.

## Next Route
- Primary: continue current phase in this protocol until verification passes.
- Blocked path: `docs/ai-setup/troubleshooting-playbooks.md`
