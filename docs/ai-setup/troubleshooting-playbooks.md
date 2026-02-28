# Troubleshooting Decision Tree and Playbooks

## Objective
- Resolve setup failures with deterministic symptom-led playbooks.

## Decision Tree
1. `401/403` from proxy route -> check auth/session and trusted headers.
2. `404` or wrong dashboard route -> check `pathPrefix` and Grafana `root_url` alignment.
3. Timeout (`504` or iframe stuck loading) -> check Grafana reachability and DNS/network.
4. Grafana UI loads partially -> check sub-path, cookies, and embedding settings.

## Playbook Card Schema
- Symptom
- Likely causes
- Checks
- Fixes
- Verify
- Escalation trigger

## Playbook: Auth Failure (401/403)
- Checks: user identity resolution, `userEmail`, `userRole`, inbound header stripping.
- Fixes: map session user correctly; enforce role allowlist.
- Verify: proxy health call returns expected status for authenticated user.

## Playbook: Route or Sub-Path Mismatch
- Checks: Next route path, `pathPrefix`, Grafana `serve_from_sub_path`, `root_url`.
- Fixes: align all three to `/api/grafana` unless intentionally overridden.
- Verify: iframe URL and upstream target URL match expected sub-path.

## Playbook: Docker/DNS Connectivity
- Checks: container names, exposed ports, `GRAFANA_INTERNAL_URL` value.
- Fixes: use `localhost` for host->container or service DNS for container->container.
- Verify: proxy request reaches Grafana health endpoint.

## Escalation Boundaries
- After 2 retries with unchanged evidence, stop and escalate.
- Escalate with captured command output and failing checkpoint.

## Next Route
- Primary: `docs/ai-setup/execution-protocol.md`
- Blocked path: escalate with checkpoint evidence after retry limit.
