# Repository Recognition Pipeline

## Objective
- Classify an arbitrary repository before running setup steps.

## Inputs
- `package.json`
- lockfile (`package-lock.json`, `bun.lock`, `pnpm-lock.yaml`, `yarn.lock`)
- app route structure (`app/` for Next App Router)
- env files (`.env*`, example env)
- auth/session source files

## Detection Rules
1. Confirm Next.js compatibility:
   - `package.json` contains `next` dependency >= 15.
   - App uses route handlers compatible with `Request`/`Response`.
2. Confirm React compatibility:
   - `react` and `react-dom` >= 18.
3. Detect auth pattern:
   - Existing session cookies.
   - NextAuth usage (`next-auth` imports).
   - Custom session service.
4. Detect deployment topology:
   - Host-run Next.js + Docker Grafana.
   - Both services in Docker network.

## Compatibility Verdict
- `compatible`: all required signals present.
- `compatible-with-branching`: compatible, but auth/network branch required.
- `blocked`: missing required runtime/framework constraints.

## Block Conditions
- Next.js version is below 15.
- Missing server route capability for proxy endpoint.
- No authoritative user identity source for `userEmail` and `userRole`.

## Output Schema
```json
{
  "framework": "next-app-router",
  "compatibility": "compatible-with-branching",
  "authPattern": "nextauth|session|custom",
  "networkTopology": "host-docker|docker-docker",
  "requiredBranches": ["auth", "network"],
  "blockingReasons": []
}
```

## Next Route
- Primary: `docs/ai-setup/setup-plan-generation.md`
- Blocked path: `docs/ai-setup/troubleshooting-playbooks.md`
