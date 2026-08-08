# Repository Modernization Design

**Date:** 2026-08-08  
**Status:** Approved for implementation planning  
**Scope:** Dependencies, repository cleanup, documentation, examples, Grafana test infrastructure, and verification

## Summary

Modernize the repository in four separately verified stages:

1. Root dependency and contributor-toolchain upgrades.
2. Next.js, React, and Grafana example upgrades.
3. Documentation deletion and consolidation.
4. Safe source, test, example, and script cleanup.

Update every direct dependency to the newest supported stable release. Keep only TypeScript on an explicit compatibility hold. Preserve the published package API, zero-runtime-dependency model, consumer engine and peer ranges, and every proxy security invariant.

## Evidence

The design is based on the repository and registry state observed on 2026-08-08.

- Root lint, type-checking, 54 active tests, and build pass.
- One additional component test is an empty skipped placeholder.
- Root and all four application high-severity audits currently fail on a stale `nanoid` resolution.
- Root `npm outdated` includes current patches plus TypeScript 7, jsdom 30, and jest-dom 7 majors.
- The four applications use Next.js 15.5.22 and React 18.3.1. Current stable releases are Next.js 16.3.0 and React 19.2.8.
- `docs/ai-setup/` contains 34 completed authoring, task-contract, QA, and publication-evidence files.
- `docs/dx/phase2-api-helper-guardrails.md` describes a deferred API that does not exist.
- Those 35 historical files total 50,883 bytes and are not referenced by maintained product documentation or the installable skill.
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

Use npm 12.0.2 or a newer compatible npm 12 patch. Record the package manager and contributor requirement without changing the consumer engine.

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

Latest tsup currently resolves an esbuild line with a low-severity Windows development-server advisory. The repository does not use that server path. Do not force an esbuild version outside tsup's declared range. Keep the high-severity audit gate green and remove the residual low finding when tsup updates.

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
9. Start the development server.

Remove deprecated Compose fallback logic, macOS-only port probing, duplicated prose, and stale log expectations.

## Documentation Design

Delete every tracked file under:

- `docs/ai-setup/`
- `docs/dx/`

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

Add a small built-artifact smoke job for Node 18.18 and 20.9. It validates CommonJS and ESM root imports plus pure utilities without installing modern development dependencies.

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

Delete the 35 historical files, rewrite retained docs by owner, fix clean-clone instructions, and add link validation.

Gate: no deleted-path references, all local links resolve, and documented commands map to real files and scripts.

### 4. Safe code and script cleanup

Remove internal-only source surface, the skipped placeholder, custom-session slop, and sandbox-script noise.

Gate: focused regression checks, full root suite, every application build, shell syntax, package dry-run, and Grafana runtime smoke.

Commit every stage independently. Fix or revert a failing stage before continuing.

## Verification and Acceptance

The modernization is complete when:

1. `npm outdated --long` is empty except for TypeScript 7 at the root.
2. Root and application high-severity audits pass.
3. The remaining low esbuild risk is removed or explicitly reported with its non-used code path.
4. Root lint, type-checking, tests with no skipped placeholder, build, and package dry-run pass.
5. CommonJS and ESM root entry smoke tests pass on Node 18.18 and 20.9.
6. All four applications use current Next.js and React stable versions without PostCSS or Sharp overrides.
7. All four applications pass clean installs, production builds, and production audits.
8. Grafana 13 passes health, datasource, dashboard, query, and proxied-render checks.
9. Sandbox works from a clean clone with the canonical Grafana stack.
10. All 35 historical documentation files are removed and retained local links resolve.
11. The empty skipped test, internal-only exports, global session timer, insecure random session ID, and unused session fields are removed.
12. Public exports, generated entry points, consumer engine, peer ranges, and proxy security behavior remain unchanged.
13. The worktree contains no generated or stale lockfile artifacts.

## Rollback and Deferred Decisions

- Never use `npm audit fix --force`, `--legacy-peer-deps`, or manual lockfile edits.
- Stop at the first failing clean install, build, audit, or runtime check.
- Do not weaken security settings to make Grafana 13 pass.
- Retain cleanup candidates that lack a reliable behavior lock.
- Upgrade to TypeScript 7 only after stable TypeScript ESLint support.
- Remove the esbuild risk note only after a compatible tsup release.
- Reconsider the Node 18 consumer floor only as a deliberate breaking release.
- Reconsider iframe error-state API removal only as an explicit public API change.
