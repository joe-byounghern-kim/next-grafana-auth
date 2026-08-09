# Repository Modernization Design

**Date:** 2026-08-08  
**Status:** Draft for implementation review

**Scope:** Dependencies, repository cleanup, documentation, examples, Grafana test infrastructure, and verification

## Summary

Modernize the repository in four separately verified stages:

1. Root dependency and contributor-toolchain upgrades.
2. Next.js, React, and Grafana example upgrades.
3. Documentation deletion and consolidation.
4. Safe source, test, example, and script cleanup.

Update every direct dependency to the newest supported stable release. Keep only TypeScript on an explicit compatibility hold. Preserve the published package API, zero-runtime-dependency model, consumer engine and peer ranges, and every proxy security invariant.

## Interpretation Boundaries

The initial request left six decisions implicit. This design uses the following boundaries:

- "Figure out the best approach" means produce and validate an implementation-ready strategy before applying the repository-wide major upgrades and deletions. The working repository is not considered modernized until the separate implementation plan is executed.
- "Latest" means the newest stable release compatible with the repository's supported public contract and current tooling. It does not mean forcing an unsupported major version, which is why TypeScript 7 remains on a documented hold.
- "All packages, including development dependencies" means every direct dependency and `devDependency` declared by the five tracked manifests. Transitive packages are refreshed through npm 12 lockfile resolution and audits, but are not manually forced outside their owning package's supported range.
- "Outdated docs" means unreferenced historical planning, task, and QA artifacts whose product guidance is owned elsewhere. Maintained product, security, support, API, example, and installable-skill documentation stays.
- "Useless code" means duplicated, unreachable, placeholder, internal-only, or unread code whose removal is protected by declarations, builds, tests, or runtime checks. It does not include intentionally repeated example boundaries or any public or security-sensitive behavior.
- "This repository" means files tracked by Git. Ignored local-only work, including `examples/prom-client/` and `docs/superpowers/`, is inventoried only to prevent accidental staging and is otherwise left untouched.

These boundaries were rechecked against the request after the repository inventory. They favor the cleanest reversible result over a blind version bump or deletion-by-opinion.

## Evidence

The design is based on the repository and registry state observed on 2026-08-08.

- Root lint, type-checking, 54 active tests, and build pass.
- One additional component test is an empty skipped placeholder.
- Root and all four application high-severity audits currently fail on a stale `nanoid` resolution.
- Root `npm outdated` includes current patches plus TypeScript 7, jsdom 30, and jest-dom 7 majors.
- `git ls-files` identifies exactly five repository package manifests: the root, Basic, Custom Session, NextAuth, and Sandbox. A separate `examples/prom-client/` package exists only in the ignored local working tree; it is not referenced by tracked files and must not be modified or staged by this repository plan.
- The four applications use Next.js 15.5.22 and React 18.3.1. Current stable releases are Next.js 16.3.0 and React 19.2.8.
- `docs/ai-setup/` contains 34 completed authoring, task-contract, QA, and publication-evidence files.
- `docs/dx/phase2-api-helper-guardrails.md` describes a deferred API that does not exist.
- Two additional obsolete files exist under the ignored local-only `docs/superpowers/` path, but `git ls-files` and `git check-ignore` confirm that they are not repository content. They are not counted, staged, or deleted by this plan.
- The 35 tracked historical files total 50,883 bytes and are not referenced by maintained product documentation or the installable skill.
- Sandbox Grafana provisioning duplicates the canonical `examples/provisioning/` tree.
- Clean-clone example instructions omit the required root package build for their local `file:` dependency.
- The custom-session example contains a global interval, `Math.random()` session IDs, redundant async functions, and unused fields.
- Root source contains two internal exports that are not part of the package exports.
- Vitest enables unused globals and unused coverage configuration.

An isolated tracked-file archive validated the upgrade path:

- Latest supported root tooling passed lint, type-checking, active tests, build, and the high-severity audit.
- `vitest.config.mts` removed the Vite native-loader warning.
- All four applications passed clean installs, Next.js 16 production builds, and zero-finding production audits with React 19.
- Next.js 16 required `jsx: "react-jsx"` and `.next/dev/types/**/*.ts` in application TypeScript configs.
- PostCSS and Sharp overrides were no longer needed.
- `npm outdated` was empty after the experiment except for TypeScript 7.

### Acceptance rerun on 2026-08-09

The proposed result was rerun through representative package, application, and end-user paths before approving implementation:

- The upgraded root candidate passed lint, type-checking, 58 tests with no skips, declaration and dual-module builds, and CommonJS plus ESM root-entry smoke tests on Node 18.18.0, 20.9.0, and 26.0.0. The installed Node 26 contributor graph also loaded both `./component` module formats, found exactly `GrafanaDashboard`, and retained its generated declaration.
- The root high-severity audit passed. An exact JSON assertion confirmed that the only audit result was low-severity esbuild `GHSA-g7r4-m6w7-qqqr`, the reviewed development-server path, and `npm outdated --long` reported only the intentional TypeScript 5.9.3 to 7.0.2 hold.
- Basic, Custom Session, NextAuth, and Sandbox used Next.js 16.3.0 and React 19.2.8 without overrides. Each passed an npm 12 clean install, production build, and production audit with zero findings; a strict per-manifest `npm outdated` gate returned no entries for all four applications.
- A real Grafana 13.1.3 Docker container loaded the canonical datasource and dashboard. The final verifier passed health, datasource, dashboard, and TestData query requests both directly and through the upgraded Next.js production proxy.
- A headless browser loaded `/dashboard`, navigated the same-origin Grafana iframe through `/api/grafana`, and visibly rendered the expected metric, stat, gauge, and latency panels. Grafana Live WebSocket retries remained unsupported by the existing HTTP route, but did not prevent the provisioned dashboard from rendering.
- The exact source and custom-session cleanup candidate passed the root suite and all application builds while preserving the package version, engine, peer ranges, export map, zero runtime dependencies, generated proxy signature, root entry points, and `./component` entry. A production Custom Session server backed by the real Grafana stack preserved missing/invalid credential responses, secure cookie attributes, authenticated user and proxy access, sign-out, and post-sign-out denial.
- A tracked-document snapshot without the 35 historical files had no maintained references to those paths, and the planned link checker passed all 25 retained Markdown files. This rerun also found and fixed a missing explicit search path in the plan's non-interactive `rg` command.
- The exact `QUICK_START_VERIFY_ONLY=1 ./sandbox/quick-start.sh` branch completed on the isolated upgraded candidate with npm 12. It clean-installed and built the root package, clean-installed and built the sandbox, started Grafana and the production Next.js server, passed direct and proxied verification, and removed its temporary Docker resources. Earlier attempts exposed and corrected a `curl | grep -q` false failure under `pipefail` and added application-process liveness detection so an early server exit fails promptly.
- An exact root-manifest rerun exposed a bootstrap cycle: a hard-failing `devEngines.packageManager` saw the npm 11 launcher before `npx npm@12.0.2` could start. The design now keeps the exact `packageManager` pin, npm 12 lockfile commands, CI pin, quick-start preflight, and final assertions, but limits hard `devEngines` enforcement to Node. The corrected exact manifest and meta-package ESLint/Vitest/TypeScript configuration then passed a clean npm 12 install, lint, type-checking, 58 tests, build, root smoke, component smoke, and direct dependency listing.

Grafana's first cold start took about 102 seconds while it ran migrations. Compose temporarily reported the container as unhealthy before it recovered. The plan now gives both the Compose health check and the condition-based verifier a 180-second readiness window, rather than treating an early `docker compose up --wait` result as final. A second fresh-volume `docker compose up --wait` run with that window reached healthy status in 71 seconds.

These checks validate the approach, not completion of the modernization. The working repository still contains the old dependency graph, historical docs, and cleanup candidates until the implementation plan is executed. Hosted CI matrices, the final retained-document rewrites, and a post-commit run from an actual clean clone remain final implementation gates.

### Request-to-check traceability

| Requested outcome | Design decision | Concrete check and observed result |
| --- | --- | --- |
| Update all packages, including development dependencies | Upgrade every direct dependency and development dependency in all five tracked manifests to the newest compatible stable release, with TypeScript as the sole compatibility hold; leave ignored local-only packages untouched | Exact tracked-manifest count, root and per-application manifest assertions, registry inventory, and npm 12 lockfile experiments; root outdated output contained only TypeScript 7; strict outdated checks were empty for all four tracked applications; root and application clean installs, builds, and high-severity audits passed |
| Remove outdated documentation | Delete exactly 35 tracked, unreferenced planning, QA, and deferred-API files, then retire this design and plan after implementation; retain product, API, security, support, example, and skill owners | Tracked-file count was exactly 35; retained-reference search found no dependency; the exact planned link checker passed 25 retained Markdown files after omission; current execution artifacts have an explicit retirement step |
| Remove useless code | Limit removal to internal-only exports, a skipped placeholder, redundant normalization, duplicated Grafana infrastructure, and demonstrably unused custom-session behavior | Root tests reported 58 passes and zero skips; root and component declarations and built exports remained equivalent; four session regressions and the production Custom Session HTTP flow passed; all applications and the real dashboard path still worked |
| Produce the cleanest maintainable codebase | Use one Grafana stack, one documentation owner per fact, supported lint/test packages, and no speculative shared example abstraction | The canonical examples stack served the upgraded sandbox end to end; duplicate sandbox infrastructure was not needed for the runtime path; configuration and source cleanup passed the full candidate suite |
| Avoid regressions while cleaning | Preserve public exports, consumer floors, zero runtime dependencies, proxy security behavior, and independently understandable examples | Node 18 and 20 root built-artifact smoke passed; the installed graph passed `./component` CJS/ESM/declaration smoke; engine, peers, export map, runtime dependency count, generated proxy signature, named handler/integration/component regressions, direct and proxied API checks, Custom Session HTTP routes, and browser rendering were unchanged or successful; the implementation plan maps each protected behavior to its exact gate |
| Keep the work safe and reversible | Execute four independently gated stages and stop on the first failed clean install, build, audit, declaration, link, Compose, or runtime check | The plan defines task-scoped commits and rollback gates; the validation loop caught and corrected one non-interactive command defect before implementation |

## Goals

- Bring every direct root and application dependency to the latest compatible stable release.
- Eliminate all high and critical audit findings without forcing invalid resolutions.
- Encode the sole compatibility hold so automation stops proposing known-broken upgrades.
- Remove obsolete documentation, duplicated infrastructure, and provably unnecessary code.
- Make every documented clean-clone workflow executable.
- Keep each change reversible and behavior-locked.

## Non-goals

- No public API changes.
- No proxy security, response, timeout, cookie, redirect, or iframe behavior changes.
- No change to the published Node `>=18.18.0` engine.
- No change to Next.js `>=15` or React `>=18` peer minimums.
- No forced TypeScript 7 installation.
- No new proxy-handler abstraction or deferred `createGrafanaProxyHandler` implementation.
- No package version bump or release publication.
- No removal of intentionally self-contained examples.

## Compatibility Policy

### Published package

Retain:

- Node.js `>=18.18.0`
- Next.js `>=15.0.0`
- React and ReactDOM `>=18.0.0`
- zero runtime dependencies
- CommonJS and ESM entry points

### Contributor toolchain

Use the range required by npm 12 and jsdom 30:

```text
^22.22.2 || ^24.15.0 || >=26.0.0
```

Use npm 12.0.2 or a newer compatible npm 12 patch. Record the exact manager in `packageManager`, pin it in repository-owned workflows, and validate it in quick-start/final gates without adding a bootstrap-circular hard `devEngines.packageManager` failure. Keep hard `devEngines` enforcement for the contributor Node range only, without changing the consumer engine.

### TypeScript hold

Keep TypeScript 5.9.3. The latest `typescript-eslint` 8.66.0 peer range is `>=4.8.4 <6.1.0`, so TypeScript 7.0.2 is unsupported.

Dependabot must ignore only TypeScript semver-major updates. Remove the hold when a stable TypeScript ESLint release supports TypeScript 7 and the full root suite passes.

## Dependency Design

### Root

Use current compatible stable versions. The verified baseline is:

| Package | Selected line |
| --- | --- |
| `@eslint/js` | 10.0.x |
| `eslint` | 10.8.x |
| `typescript-eslint` | 8.66.x |
| `typescript` | 5.9.3 hold |
| `vitest` | 4.1.x |
| `jsdom` | 30.0.x |
| `@testing-library/jest-dom` | 7.0.x |
| `@testing-library/react` | 16.3.x |
| `@types/node` | 26.x |
| `@types/react` | 19.2.x |
| `@types/react-dom` | 19.2.x |
| `tsup` | 8.5.x |

Replace direct `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin` declarations with the supported `typescript-eslint` meta-package. Refresh root peer resolutions to current Next.js and React versions without changing peer ranges.

Latest tsup currently resolves esbuild 0.27.7 with low-severity Windows development-server advisory `GHSA-g7r4-m6w7-qqqr`. The repository does not use that server path. A non-forced `npm audit fix --dry-run` proposed downgrading esbuild and its platform binary from 0.27.7 to 0.27.2, while a fixed newer line is outside tsup's declared range. Reject both the downgrade and an unsupported override, keep the exact high-severity and residual-advisory assertions green, and remove the finding when tsup updates.

### Applications

Apply to `examples/basic`, `examples/custom-session`, `examples/nextauth`, and `sandbox`:

- exact current stable Next.js 16.x
- exact matching React and ReactDOM 19.x
- latest stable NextAuth 4.x in the NextAuth example
- no PostCSS or Sharp overrides
- npm 12-generated lockfiles

Update each application `tsconfig.json` before builds so Next.js does not rewrite tracked files:

- `jsx: "react-jsx"`
- include `.next/dev/types/**/*.ts`

Keep existing Turbopack workspace-root settings for local root-package links.

## Configuration and Source Cleanup

### Test and lint configuration

- Rename `vitest.config.ts` to `vitest.config.mts`.
- Remove Vitest globals because tests import their APIs.
- Remove unused coverage configuration instead of adding an unused provider dependency.
- Use the supported jest-dom Vitest entry point if verification passes.
- Keep explicit Testing Library cleanup.
- Enforce unused locals and parameters after confirming the current source remains clean.
- Preserve the build-metadata regression test.

### Production source

Remove only:

- the internal `ProxyHandlerFunction` alias when generated declarations remain equivalent
- the internal-only `stripLeadingSlash` export, or inline its single use
- redundant `className ?? undefined` normalization
- obvious comments that merely restate code
- the empty skipped iframe-error test

Preserve all public exports, Set-Cookie compatibility paths, header allowlists, defense-in-depth filtering, redirects, request bodies, timeouts, iframe states, retry behavior, sandbox behavior, and accessibility behavior.

Do not replace the empty iframe-error placeholder with a false jsdom regression. React/jsdom cannot faithfully dispatch this boundary, and real browsers do not guarantee an iframe `error` event for HTTP failures. Preserve the error-state props, declaration, handler, and source path unchanged; any removal is a deferred public API decision.

### Custom-session example

- Use `crypto.randomUUID()` for session IDs.
- Store only fields that are read.
- Remove the global cleanup interval.
- Delete expired sessions during lookup and, if useful, during creation.
- Remove unnecessary async declarations and update callers.
- Label credentials and in-memory storage as local demo behavior.
- Keep production guidance for durable storage, password hashing, CSRF protection, rate limiting, and session rotation.

Do not introduce shared example abstractions. Repeated route code keeps each auth example independently understandable.

## Grafana and Sandbox Design

Keep one canonical local Grafana stack:

```text
examples/docker-compose.yml
examples/provisioning/
examples/grafana/README.md
```

Update the example image from Grafana 11.6.5 to Grafana 13.1.3, the stable release observed on 2026-08-08. The example image version does not change the package's documented compatibility floor.

Clean the Compose file:

- remove the obsolete top-level `version`
- remove `GF_SERVER_ALLOW_EMBEDDING`
- keep `GF_SECURITY_ALLOW_EMBEDDING=true`
- use `GF_SECURITY_COOKIE_SECURE=false` for local HTTP
- retain sub-path alignment, auth-proxy headers, provisioning, health checks, and a named volume

Delete `sandbox/docker-compose.yml` and the three duplicated sandbox provisioning files. Point sandbox automation and CI to the canonical examples stack.

Rewrite `sandbox/quick-start.sh` to:

1. Resolve repository paths reliably.
2. Require the full contributor Node range because a clean clone must build the root package.
3. Require Docker Compose v2.
4. Install and build the root package.
5. Install the sandbox.
6. Start and await the canonical Grafana stack.
7. Verify health, datasource, dashboard, and TestData query responses.
8. Create `.env` only when missing.
9. In verification mode, build and start the production sandbox, verify the application proxy and dashboard route, stop the application, and exit.
10. Otherwise, start the development server for interactive use.

Remove deprecated Compose fallback logic, macOS-only port probing, duplicated prose, and stale log expectations.

## Documentation Design

Delete every tracked file under:

- `docs/ai-setup/`
- `docs/dx/`

This design and its implementation plan remain only while they govern active work. After final acceptance and independent review, delete both `docs/2026-08-08-repository-modernization-design.md` and `docs/2026-08-08-repository-modernization-plan.md`; Git history preserves the decision record without leaving version-pinned execution artifacts in maintained documentation.

The maintained documentation owners are:

| File | Responsibility |
| --- | --- |
| `README.md` | Value, install, minimal use, critical invariants, navigation |
| `GETTING_STARTED.md` | One integration workflow and auth-path routing |
| `docs/API_REFERENCE.md` | Exact exports, types, defaults, behavior |
| `TROUBLESHOOTING.md` | Symptom-first diagnosis |
| `examples/README.md` | Example selection |
| `examples/grafana/README.md` | Canonical Grafana setup and lifecycle |
| Example READMEs | Example-specific auth and setup only |
| `sandbox/README.md` | Quick evaluation, validation, teardown |
| `CONTRIBUTING.md` | Contributor toolchain and checks |
| `RELEASE_CHECKLIST.md` | Release-specific checklist only |
| `.agents/skills/next-grafana-auth/*` | Installable AI workflow |
| `SECURITY.md` | Security policy |
| `SUPPORT.md` | Support policy |

Cleanup rules:

- One canonical owner per setup fact.
- Repeat security invariants only where omission would be dangerous.
- Distinguish support floors from example versions.
- Include root install and build steps in clean-clone workflows.
- Remove stale logs, repeated troubleshooting, code statistics, generic tutorials, task IDs, and historical acceptance gates.
- Add a dependency-free local Markdown link check.

## CI and Dependabot

Full contributor jobs run on Node 22.22.2, 24.15.0, and 26.x with npm 12. Apply this to root tests, example builds, audits, and release validation.

Add a small built-artifact smoke job for Node 18.18 and 20.9. It validates CommonJS and ESM root imports plus pure utilities without installing modern development dependencies. Validate the React-backed `./component` entry separately on installed contributor graphs.

Keep root lint, type-checking, tests, build, bundle-size, package dry-run, and high-severity audit checks. For each application, run a clean root install and build followed by a clean application install, production build, and production audit.

Dependabot changes:

- retain grouped root lint, test, and Actions updates
- remove jsdom and jest-dom major ignores
- retain only the TypeScript major hold
- add npm coverage for all four application directories
- group application framework updates where supported
- add Docker coverage for `examples/docker-compose.yml`

## Implementation Stages

### 1. Root dependencies and toolchain

Update the root manifest, lockfile, lint/test configuration, contributor metadata, CI, and root Dependabot policy.

Gate: clean install, dependency listing, outdated report, high audit, lint, type-check, tests, build, and package dry-run.

### 2. Applications and Grafana

Upgrade applications, regenerate their lockfiles, update TypeScript configs, remove overrides, update Grafana, and consolidate sandbox infrastructure.

Gate: all application clean installs, builds, audits, Compose validation, and Grafana runtime smoke.

### 3. Documentation

Delete the 35 tracked historical files, rewrite retained docs by owner, fix clean-clone instructions, add link validation, and retire this design and plan after final acceptance.

Gate: no deleted-path references, all local links resolve, and documented commands map to real files and scripts.

### 4. Safe code and script cleanup

Remove internal-only source surface, the skipped placeholder, custom-session slop, and sandbox-script noise.

Gate: focused regression checks, full root suite, every application build, shell syntax, package dry-run, and Grafana runtime smoke.

Commit every stage independently. Fix or revert a failing stage before continuing.

## Verification and Acceptance

The modernization is complete when:

1. `npm outdated --long` is empty for every application and empty except for TypeScript 7 at the root.
2. Root and application high-severity audits pass.
3. The complete audit JSON is empty or contains only low-severity esbuild `GHSA-g7r4-m6w7-qqqr`, explicitly reported with its non-used development-server path.
4. Root lint, type-checking, tests with no skipped placeholder, build, and package dry-run pass.
5. CommonJS and ESM root entry smoke tests pass on Node 18.18 and 20.9, and the installed contributor graph preserves the CJS, ESM, and declaration `./component` entry.
6. All four applications use current Next.js and React stable versions without PostCSS or Sharp overrides.
7. All four applications pass clean installs, production builds, and production audits.
8. Grafana 13 passes direct and proxied health, datasource, dashboard, query, route, and agent-assisted visible-panel checks.
9. `QUICK_START_VERIFY_ONLY=1 ./sandbox/quick-start.sh` passes from a clean clone with the canonical Grafana stack.
10. All 35 tracked historical documentation files are removed, retained local links resolve, and this design and plan are retired after final acceptance.
11. The empty skipped test, internal-only exports, global session timer, insecure random session ID, and unused session fields are removed.
12. Public root and component exports, generated entry points, component error-state declaration/source surface, consumer engine, peer ranges, and proxy security behavior remain unchanged.
13. The worktree contains no generated or stale lockfile artifacts.
14. The real production Custom Session sign-in, user, Grafana proxy, sign-out, and revoked-session routes retain their HTTP contract.

## Rollback and Deferred Decisions

- Never use `npm audit fix --force`, `--legacy-peer-deps`, or manual lockfile edits.
- Stop at the first failing clean install, build, audit, or runtime check.
- Do not weaken security settings to make Grafana 13 pass.
- Retain cleanup candidates that lack a reliable behavior lock.
- Upgrade to TypeScript 7 only after stable TypeScript ESLint support.
- Remove the esbuild risk note only after a compatible tsup release.
- Reconsider the Node 18 consumer floor only as a deliberate breaking release.
- Reconsider iframe error-state API removal only as an explicit public API change.
