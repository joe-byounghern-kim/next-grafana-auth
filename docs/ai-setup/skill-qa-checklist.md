# SKL-009 QA Checklist

## Content Contract Checks
- [x] Frontmatter has valid `name` and high-signal `description`.
- [x] `SKILL.md` includes trigger and anti-trigger guidance.
- [x] Core path is concise and deterministic.
- [x] One-hop reference model is preserved.

## Security Invariant Checks
- [x] Guidance explicitly states inbound `X-WEBAUTH-*` is untrusted.
- [x] Guidance explicitly states `Authorization` and `Cookie` must not be proxied upstream.
- [x] Role mapping constraints (`Admin|Editor|Viewer`) are explicit.

## Random-Project Readiness Checks
- [x] Auth branching covers NextAuth, Clerk, and custom session.
- [x] Topology branching covers host+docker and container+container.
- [x] Route/prefix/root_url alignment is explicit.

## Installability Checks
- [x] Harness positive and negative cases are defined and executed.
- [x] Evidence uses command/exit/output/install-state schema.
- [ ] At least one mandatory positive-path install case passes (`owner/repo` forms).

## Verification Gate
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run test:run`
- [x] `npm run build`

## Current Gate Outcome
- Status: `No-Go`
- Blocking reason: positive installability matrix remains `0/3`.
