# Validation Harness and Dry-Run Scenarios

## Objective
- Validate that AI docs produce correct, repeatable setup outcomes.

## Scenario Matrix
- Minimal Next.js app (no external auth provider).
- NextAuth integration.
- Custom session integration.
- Host-run Next.js + Docker Grafana.
- Dockerized Next.js + Docker Grafana service DNS.

## Dry-Run Procedure
1. Follow only AI setup docs for the chosen scenario.
2. Record each checkpoint and command output.
3. Stop at first blocking failure and route to troubleshooting.
4. Retry once with documented fix.

## Pass/Fail Signals
- Pass: route proxy responds, iframe loads, verification commands pass.
- Fail: unresolved block condition or verification command failure.

## Evidence Artifacts
- Command logs for lint, typecheck, tests, build.
- Route file path and proxy config snippet.
- Dashboard URL and load-state evidence.

## Regression Cadence
- Run all scenarios before major release.
- Run targeted scenario after any docs change affecting execution logic.

## Command Set
- `npm run lint`
- `npm run typecheck`
- `npm run test:run`
- `npm run build`

## Next Route
- Primary: `docs/ai-setup/rollout-migration.md`
- Blocked path: `docs/ai-setup/troubleshooting-playbooks.md`
