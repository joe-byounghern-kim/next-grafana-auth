# Repository Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Use `superpowers:test-driven-development` for each red/green cycle and `superpowers:verification-before-completion` before claiming success. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade every direct root and application dependency to the latest supported stable release, consolidate local Grafana infrastructure, and remove obsolete documentation and demonstrably unnecessary code without changing the published API or proxy security behavior.

**Architecture:** Execute four sequential stages: root toolchain, applications and Grafana, documentation, then safe code cleanup. Each stage has its own clean-install and behavior gate, and each task ends in a focused commit. The package keeps its broad consumer contract while repository-owned contributor jobs use the newer Node and npm versions required by current development tools.

**Tech Stack:** npm 12 lockfile v3, Node.js contributor matrix `22.22.2`, `24.15.0`, and `26.x`, TypeScript 5.9.3, ESLint 10.8, `typescript-eslint` 8.66, Vitest 4.1, jsdom 30, Next.js 16.3.0, React 19.2.8, NextAuth 4.24.15, Grafana 13.1.3, Docker Compose v2, GitHub Actions, Dependabot.

## Global Constraints

- Preserve the published consumer engine exactly as Node.js `>=18.18.0`.
- Preserve peer minimums exactly as Next.js `>=15.0.0`, React `>=18.0.0`, and ReactDOM `>=18.0.0`.
- Preserve zero runtime dependencies, CommonJS and ESM entry points, package version `1.0.3`, and every documented public export.
- Contributor tooling requires `^22.22.2 || ^24.15.0 || >=26.0.0` and npm `12.0.2` or a newer compatible npm 12 patch.
- Keep TypeScript at `5.9.3`. It is the only compatibility hold because `typescript-eslint` 8.66.0 supports TypeScript `<6.1.0`, not TypeScript 7.0.2.
- Use Next.js `16.3.0`, React `19.2.8`, ReactDOM `19.2.8`, NextAuth `^4.24.15`, and Grafana `13.1.3`, unless a newer stable patch is re-verified immediately before implementation.
- Never use `npm audit fix --force`, `--legacy-peer-deps`, or manual lockfile edits.
- Do not change proxy URL construction, trusted identity headers, header allowlists, Set-Cookie handling, redirect behavior, request bodies, timeout behavior, iframe states, retry behavior, sandbox semantics, or accessibility behavior.
- Do not add the deferred `createGrafanaProxyHandler` abstraction or introduce shared application-route abstractions.
- Stop at the first failing clean install, build, audit, declaration check, Compose check, or runtime smoke. Fix or revert that task before proceeding.
- Keep each commit limited to its task. Do not include ignored local tool data, generated `.next` output, `node_modules`, `dist`, or unrelated working-tree changes.

---

## Planned File Map

### Create

- `scripts/smoke-built-package.mjs`: dependency-free CommonJS and ESM built-artifact smoke test.
- `scripts/verify-grafana.sh`: canonical health, datasource, dashboard, query, and optional proxied-render validation.
- `scripts/check-markdown-links.mjs`: dependency-free tracked-Markdown link and anchor validator.
- `tests/custom-session.test.ts`: regression coverage for the custom-session demo store.

### Rename

- `vitest.config.ts` to `vitest.config.mts`: force the native ESM configuration path and remove the Vite loader warning.

### Modify

- Root toolchain: `package.json`, `package-lock.json`, `eslint.config.mjs`, `tsconfig.json`, `tests/setup.ts`.
- Automation: `.github/workflows/test.yml`, `.github/workflows/security.yml`, `.github/workflows/release.yml`, `.github/dependabot.yml`.
- Applications: each `package.json`, `package-lock.json`, and `tsconfig.json` under `examples/basic`, `examples/custom-session`, `examples/nextauth`, and `sandbox`.
- Grafana and sandbox: `examples/docker-compose.yml`, `sandbox/quick-start.sh`, and the sandbox runtime block in `.github/workflows/test.yml`.
- Maintained docs: `README.md`, `GETTING_STARTED.md`, `TROUBLESHOOTING.md`, `CONTRIBUTING.md`, `RELEASE_CHECKLIST.md`, `examples/README.md`, `examples/grafana/README.md`, all three example READMEs, and `sandbox/README.md`.
- Safe cleanup: `src/index.ts`, `src/types.ts`, `src/utils.ts`, `src/component.tsx`, `tests/component.test.tsx`, `examples/custom-session/app/lib/session.ts`, and four custom-session route callers.

### Delete

- Every tracked file under `docs/ai-setup/` and `docs/dx/`, exactly 35 files.
- `sandbox/docker-compose.yml`.
- `sandbox/provisioning/datasources/datasource.yml`.
- `sandbox/provisioning/dashboards/dashboard.yml`.
- `sandbox/provisioning/dashboards/json/demo-dashboard.json`.

### Preserve Without Functional Changes

- `.agents/skills/next-grafana-auth/*`, `SECURITY.md`, `SUPPORT.md`, `CODE_OF_CONDUCT.md`, all public package exports, all example route boundaries, and all canonical Grafana provisioning files under `examples/provisioning/`.

---

# Stage 1: Root Dependencies and Contributor Toolchain

### Task 1: Upgrade and simplify the root development toolchain

**Files:**

- Modify: `package.json:25-68`
- Modify: `package-lock.json`
- Modify: `eslint.config.mjs`
- Modify: `tsconfig.json:2-20`
- Rename: `vitest.config.ts` to `vitest.config.mts`
- Modify: `tests/setup.ts`

**Interfaces:**

- Consumes: existing package exports, peer ranges, tsup build metadata, and the current 54 active root tests.
- Produces: an npm 12-generated root graph using the latest compatible tooling, explicit contributor runtime metadata, ESM-native Vitest configuration, and enforced unused-symbol checks.

- [ ] **Step 1: Record the current root baseline and expected dependency failures**

Run:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
npm audit --audit-level=high
npm outdated --long || true
```

Expected before changes: lint, type-check, 54 active tests, and build pass; one test is skipped; the high audit reports stale `nanoid`; outdated output includes current patches plus TypeScript 7, jsdom 30, and jest-dom 7.

- [ ] **Step 2: Replace the root manifest toolchain and record contributor requirements**

Keep `engines.node`, `peerDependencies`, `version`, and `files` unchanged. Add this metadata:

```json
"packageManager": "npm@12.0.2",
"devEngines": {
  "runtime": {
    "name": "node",
    "version": "^22.22.2 || ^24.15.0 || >=26.0.0",
    "onFail": "error"
  },
  "packageManager": {
    "name": "npm",
    "version": "^12.0.2 <13",
    "onFail": "error"
  }
}
```

Replace `devDependencies` with:

```json
"devDependencies": {
  "@eslint/js": "^10.0.1",
  "@testing-library/jest-dom": "^7.0.0",
  "@testing-library/react": "^16.3.2",
  "@types/node": "^26.2.0",
  "@types/react": "^19.2.18",
  "@types/react-dom": "^19.2.4",
  "eslint": "^10.8.1",
  "jsdom": "^30.0.1",
  "tsup": "^8.5.1",
  "typescript": "5.9.3",
  "typescript-eslint": "^8.66.0",
  "vitest": "^4.1.10"
}
```

Do not retain direct `@typescript-eslint/parser` or `@typescript-eslint/eslint-plugin` declarations.

- [ ] **Step 3: Convert ESLint to the supported meta-package**

Replace `eslint.config.mjs` with:

```js
import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
  }
)
```

Expected: ESLint uses the supported aggregate package and its recommended unused-variable rule instead of disabling it.

- [ ] **Step 4: Rename and reduce the Vitest configuration**

Run:

```bash
mv vitest.config.ts vitest.config.mts
```

Replace its content with:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
  },
})
```

Replace `tests/setup.ts` with:

```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(cleanup)
```

Expected: tests continue importing Vitest APIs explicitly, Testing Library cleanup remains explicit, and no unused coverage provider is implied.

- [ ] **Step 5: Enforce unused TypeScript locals and parameters**

Add to `compilerOptions` in `tsconfig.json`:

```json
"noUnusedLocals": true,
"noUnusedParameters": true
```

Do not change the root target, module resolution, declaration settings, JSX setting, include list, or exclusions.

- [ ] **Step 6: Regenerate the root lockfile only through npm 12**

Run:

```bash
rm -rf node_modules
npx --yes npm@12.0.2 install --package-lock-only
npx --yes npm@12.0.2 ci
```

Expected: lockfile version 3, no unsupported-engine warning, current Next.js and React peer resolutions, and no invalid or extraneous direct dependencies.

- [ ] **Step 7: Verify the root dependency contract**

Run:

```bash
npx --yes npm@12.0.2 ls --depth=0
npx --yes npm@12.0.2 audit --audit-level=high
npx --yes npm@12.0.2 outdated --json > "$JCODE_SCRATCH_DIR/root-outdated.json" || test $? -eq 1
node - "$JCODE_SCRATCH_DIR/root-outdated.json" <<'NODE'
const fs = require('node:fs')
const report = JSON.parse(fs.readFileSync(process.argv[2], 'utf8') || '{}')
const names = Object.keys(report)
if (names.length !== 1 || names[0] !== 'typescript') {
  throw new Error(`unexpected outdated packages: ${names.join(', ') || 'none'}`)
}
if (report.typescript.current !== '5.9.3') {
  throw new Error(`unexpected TypeScript current version: ${report.typescript.current}`)
}
NODE
npm run lint
npm run typecheck
npm run test:run
npm run build
npm pack --dry-run
```

Expected: only TypeScript is outdated; the audit exits 0 at the high threshold; the residual report is at most the known low esbuild development-server advisory from tsup; all root gates pass; the Vite native-loader warning is absent.

- [ ] **Step 8: Commit the root toolchain task**

```bash
git add package.json package-lock.json eslint.config.mjs tsconfig.json tests/setup.ts vitest.config.mts
git add -u vitest.config.ts
git commit -m "chore(deps): modernize root toolchain"
```

Expected: this commit contains only root dependency and configuration changes.

---

### Task 2: Expand CI compatibility coverage and dependency automation

**Files:**

- Create: `scripts/smoke-built-package.mjs`
- Modify: `package.json:25-33`
- Modify: `.github/workflows/test.yml`
- Modify: `.github/workflows/security.yml`
- Modify: `.github/workflows/release.yml`
- Modify: `.github/dependabot.yml`

**Interfaces:**

- Consumes: `dist/index.js` and `dist/index.mjs` produced by Task 1, plus npm 12 contributor metadata.
- Produces: full contributor matrices on modern Node versions, no-install consumer smoke checks on the two older supported Node lines, application and Docker Dependabot coverage, and release validation separated from publication.

- [ ] **Step 1: Add a dependency-free built-package smoke test**

Create `scripts/smoke-built-package.mjs`:

```js
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const commonJs = require(resolve(repositoryRoot, 'dist/index.js'))
const esModule = await import(pathToFileURL(resolve(repositoryRoot, 'dist/index.mjs')).href)
const expectedExports = [
  'buildGrafanaParams',
  'extractGrafanaPath',
  'handleGrafanaProxy',
  'isValidUrl',
  'joinPaths',
  'stripTrailingSlash',
]

function verify(api, label) {
  assert.deepEqual(Object.keys(api).sort(), expectedExports, `${label} exports changed`)
  assert.equal(typeof api.handleGrafanaProxy, 'function')
  assert.equal(api.extractGrafanaPath(['d', 'uid with spaces']), 'd/uid%20with%20spaces')
  assert.equal(api.joinPaths('/api/grafana/', '/d/', 'uid'), 'api/grafana/d/uid')
  assert.equal(api.stripTrailingSlash('http://grafana:3000///'), 'http://grafana:3000')
  assert.equal(api.isValidUrl('https://grafana.example.com'), true)
  assert.equal(api.isValidUrl('javascript:alert(1)'), false)
  assert.equal(
    api.buildGrafanaParams({ kiosk: true, variables: { region: ['us', 'eu'] } }).toString(),
    'kiosk=1&var-region=us&var-region=eu'
  )
}

verify(commonJs, 'CommonJS')
verify(esModule, 'ESM')
console.log(`Built package smoke passed on Node ${process.versions.node}`)
```

Add this script to `package.json`:

```json
"smoke:dist": "node scripts/smoke-built-package.mjs"
```

Run:

```bash
npm run build
npm run smoke:dist
```

Expected: both entry points expose exactly the documented root exports and pure utilities return identical values.

- [ ] **Step 2: Update the main CI contributor matrix**

In `.github/workflows/test.yml`:

1. Set the root `test` matrix to quoted values `['22.22.2', '24.15.0', '26.x']`.
2. Add `npm install --global npm@12.0.2` immediately after every modern `setup-node` step and before `npm ci`.
3. Keep type-check, lint, tests, build, artifact upload, bundle-size, and application build gates.
4. Use Node `22.22.2` for the single bundle-size job.
5. Expand `examples-smoke` to the Cartesian matrix of all four `app-dir` values and all three contributor Node values.
6. Keep the sandbox Docker runtime smoke restricted to `matrix.app-dir == 'sandbox' && matrix.node-version == '22.22.2'` so application builds get full coverage without tripling the Docker runtime test.
7. Replace the npm 11 pin with npm `12.0.2`.

Add this no-install job after `test`:

```yaml
  consumer-runtime-smoke:
    name: Consumer Runtime Smoke (Node ${{ matrix.node-version }})
    runs-on: ubuntu-latest
    needs: test
    strategy:
      matrix:
        node-version: ['18.18.0', '20.9.0']
    steps:
      - name: Checkout
        uses: actions/checkout@v7

      - name: Download built package
        uses: actions/download-artifact@v8
        with:
          name: dist-node-22.22.2
          path: dist

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v7
        with:
          node-version: ${{ matrix.node-version }}

      - name: Smoke CommonJS and ESM entry points
        run: node scripts/smoke-built-package.mjs
```

Do not run `npm ci` in this job. Its purpose is to prove the built library still works on consumer Node versions that cannot install the modern contributor graph.

- [ ] **Step 3: Update security matrices**

In `.github/workflows/security.yml`:

- Give `dependency-audit` a Node matrix of `['22.22.2', '24.15.0', '26.x']`.
- Give `example-audit` both the same Node matrix and the four existing app directories.
- Pin npm `12.0.2` before each install.
- Keep root build before application install.
- Keep `npm audit --audit-level=high` for root and `npm audit --prefix ... --audit-level=high --omit=dev` for applications.
- Leave CodeQL configuration unchanged.

Expected: all repository-owned dependency graphs are audited on every contributor runtime, while CodeQL remains a hard failure.

- [ ] **Step 4: Separate release validation from publication**

Refactor `.github/workflows/release.yml` into:

- `validate`: matrix `['22.22.2', '24.15.0', '26.x']`; checkout; setup Node; pin npm 12.0.2; `npm ci`; type-check; lint; tests; build; high audit; `npm pack --dry-run`.
- `publish`: `needs: validate`; Node `22.22.2`; npm 12.0.2; clean install; build; tag/package version equality check; `npm publish --provenance --access public`; GitHub release creation.

Keep `contents: write` and `id-token: write` only on `publish`. Do not add a version bump or tag creation step.

- [ ] **Step 5: Expand Dependabot while retaining only the TypeScript hold**

Update the root lint group pattern from `@typescript-eslint/*` to `typescript-eslint`. Delete the jsdom and jest-dom ignore blocks. Retain only:

```yaml
ignore:
  - dependency-name: typescript
    update-types:
      - version-update:semver-major
```

Add one weekly npm entry for each directory:

```text
/examples/basic
/examples/custom-session
/examples/nextauth
/sandbox
```

Each application entry must group `next`, `react`, and `react-dom`; the NextAuth entry must also group `next-auth`. Add weekly Docker coverage for directory `/examples` and group the `grafana/grafana` image. Keep grouped GitHub Actions updates.

- [ ] **Step 6: Verify automation structure locally**

Run:

```bash
npm run build
npm run smoke:dist
ruby -e 'require "yaml"; %w[.github/workflows/test.yml .github/workflows/security.yml .github/workflows/release.yml .github/dependabot.yml].each { |f| YAML.load_file(f, aliases: true); puts "valid YAML: #{f}" }'
rg -n "22\.22\.2|24\.15\.0|26\.x|18\.18\.0|20\.9\.0|npm@12\.0\.2" .github package.json
rg -n "jsdom|@testing-library/jest-dom" .github/dependabot.yml
```

Expected: all YAML parses; all required Node/npm values are present; the final grep finds jsdom and jest-dom only in grouping patterns, never in ignore blocks.

- [ ] **Step 7: Commit the automation task**

```bash
git add package.json scripts/smoke-built-package.mjs .github/workflows/test.yml .github/workflows/security.yml .github/workflows/release.yml .github/dependabot.yml
git commit -m "ci: expand dependency and runtime coverage"
```

Expected: Stage 1 is independently green with modern contributor installs and old-runtime built-artifact coverage.

---

# Stage 2: Applications, Grafana, and Sandbox

### Task 3: Upgrade all four Next.js applications

**Files:**

- Modify: `examples/basic/package.json`, `examples/basic/package-lock.json`, `examples/basic/tsconfig.json`
- Modify: `examples/custom-session/package.json`, `examples/custom-session/package-lock.json`, `examples/custom-session/tsconfig.json`
- Modify: `examples/nextauth/package.json`, `examples/nextauth/package-lock.json`, `examples/nextauth/tsconfig.json`
- Modify: `sandbox/package.json`, `sandbox/package-lock.json`, `sandbox/tsconfig.json`

**Interfaces:**

- Consumes: the root `dist` output through existing local `file:` dependencies and existing Turbopack workspace roots.
- Produces: four clean npm 12 application graphs on Next.js 16.3.0 and React 19.2.8 with no PostCSS or Sharp overrides.

- [ ] **Step 1: Update TypeScript configs before running Next.js 16**

In all four application `tsconfig.json` files:

- Set `compilerOptions.jsx` to `"react-jsx"`.
- Add `".next/dev/types/**/*.ts"` to `include`.
- Preserve every other compiler option and each existing Next plugin.

The resulting include list must contain:

```json
[
  "next-env.d.ts",
  "**/*.ts",
  "**/*.tsx",
  ".next/types/**/*.ts",
  ".next/dev/types/**/*.ts"
]
```

Order may follow each file's existing format, but Next.js must not rewrite tracked configuration during the build.

- [ ] **Step 2: Update the application manifests**

For Basic, use:

```json
"dependencies": {
  "next": "16.3.0",
  "next-grafana-auth": "file:../..",
  "react": "19.2.8",
  "react-dom": "19.2.8"
}
```

For Custom Session, use:

```json
"dependencies": {
  "next": "16.3.0",
  "next-grafana-auth": "file:../..",
  "react": "19.2.8",
  "react-dom": "19.2.8"
}
```

For Sandbox, use:

```json
"dependencies": {
  "next": "16.3.0",
  "next-grafana-auth": "file:../",
  "react": "19.2.8",
  "react-dom": "19.2.8"
}
```

For NextAuth, use:

```json
"dependencies": {
  "next": "16.3.0",
  "next-auth": "^4.24.15",
  "next-grafana-auth": "file:../..",
  "react": "19.2.8",
  "react-dom": "19.2.8"
}
```

Delete every application `overrides` object. Preserve names, versions, privacy, scripts, and local package paths.

- [ ] **Step 3: Regenerate all four lockfiles with npm 12**

Run from repository root after `npm run build`:

```bash
for app in examples/basic examples/custom-session examples/nextauth sandbox; do
  rm -rf "$app/node_modules" "$app/.next"
  npx --yes npm@12.0.2 install --package-lock-only --prefix "$app"
done
```

Expected: lockfile version 3, local `file:` links retained, no root `../../node_modules/*` package keys, and no PostCSS or Sharp overrides recorded.

- [ ] **Step 4: Verify every application cleanly**

Run:

```bash
npm run build
for app in examples/basic examples/custom-session examples/nextauth sandbox; do
  rm -rf "$app/node_modules" "$app/.next"
  npx --yes npm@12.0.2 ci --prefix "$app"
  GRAFANA_INTERNAL_URL=http://localhost:3001 \
  NEXTAUTH_SECRET=sandbox-ci-secret \
  NEXTAUTH_URL=http://localhost:3000 \
    npx --yes npm@12.0.2 run build --prefix "$app"
  npx --yes npm@12.0.2 audit --prefix "$app" --audit-level=high --omit=dev
  npx --yes npm@12.0.2 outdated --prefix "$app" --long || true
done
```

Expected: all four production builds pass; all production audits report zero high or critical findings; outdated output is empty; tracked `tsconfig.json` files are unchanged by the builds.

- [ ] **Step 5: Verify application manifest invariants**

Run:

```bash
node <<'NODE'
const fs = require('node:fs')
for (const dir of ['examples/basic', 'examples/custom-session', 'examples/nextauth', 'sandbox']) {
  const pkg = JSON.parse(fs.readFileSync(`${dir}/package.json`, 'utf8'))
  if (pkg.dependencies.next !== '16.3.0') throw new Error(`${dir}: wrong Next.js`)
  if (pkg.dependencies.react !== '19.2.8') throw new Error(`${dir}: wrong React`)
  if (pkg.dependencies['react-dom'] !== '19.2.8') throw new Error(`${dir}: wrong ReactDOM`)
  if (pkg.overrides) throw new Error(`${dir}: overrides remain`)
}
NODE
```

Expected: exit 0.

- [ ] **Step 6: Commit the application upgrades**

```bash
git add examples/basic examples/custom-session examples/nextauth sandbox/package.json sandbox/package-lock.json sandbox/tsconfig.json
git commit -m "chore(examples): upgrade to Next.js 16 and React 19"
```

Expected: only application manifests, npm-generated lockfiles, and TypeScript configs are included.

---

### Task 4: Consolidate Grafana and make sandbox automation canonical

**Files:**

- Create: `scripts/verify-grafana.sh`
- Modify: `examples/docker-compose.yml`
- Modify: `sandbox/quick-start.sh`
- Modify: `.github/workflows/test.yml`
- Delete: `sandbox/docker-compose.yml`
- Delete: `sandbox/provisioning/datasources/datasource.yml`
- Delete: `sandbox/provisioning/dashboards/dashboard.yml`
- Delete: `sandbox/provisioning/dashboards/json/demo-dashboard.json`

**Interfaces:**

- Consumes: canonical provisioning under `examples/provisioning/`, Grafana's auth-proxy headers, the sandbox's hardcoded server-side demo identity, and the four upgraded applications.
- Produces: one Grafana 13.1.3 stack used by examples, sandbox, CI, and documentation, plus one reusable runtime verifier.

- [ ] **Step 1: Add the canonical Grafana verifier**

Create executable `scripts/verify-grafana.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

GRAFANA_BASE_URL="${GRAFANA_BASE_URL:-http://localhost:3001/api/grafana}"
APP_BASE_URL="${APP_BASE_URL:-}"
AUTH_USER="${AUTH_USER:-demo@example.com}"
AUTH_ROLE="${AUTH_ROLE:-Viewer}"
GRAFANA_BASE_URL="${GRAFANA_BASE_URL%/}"
APP_BASE_URL="${APP_BASE_URL%/}"

request_grafana() {
  curl -fsS \
    -H "X-WEBAUTH-USER: ${AUTH_USER}" \
    -H "X-WEBAUTH-ROLE: ${AUTH_ROLE}" \
    "$@"
}

ready=0
for attempt in $(seq 1 60); do
  if request_grafana "${GRAFANA_BASE_URL}/api/health" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done

if [ "$ready" -ne 1 ]; then
  echo "Grafana did not become healthy at ${GRAFANA_BASE_URL}" >&2
  exit 1
fi

request_grafana "${GRAFANA_BASE_URL}/api/datasources/uid/testdata" \
  | grep -Eq '"uid"[[:space:]]*:[[:space:]]*"testdata"'
request_grafana "${GRAFANA_BASE_URL}/api/dashboards/uid/demo-dashboard" \
  | grep -Eq '"uid"[[:space:]]*:[[:space:]]*"demo-dashboard"'

query_payload='{"queries":[{"refId":"A","datasource":{"type":"grafana-testdata-datasource","uid":"testdata"},"scenarioId":"random_walk"}],"from":"now-15m","to":"now"}'
request_grafana \
  -H 'Content-Type: application/json' \
  -X POST \
  -d "$query_payload" \
  "${GRAFANA_BASE_URL}/api/ds/query" \
  | grep -q '"frames"'

if [ -n "$APP_BASE_URL" ]; then
  app_ready=0
  for attempt in $(seq 1 60); do
    if curl -fsS "${APP_BASE_URL}/api/grafana/api/health" >/dev/null 2>&1; then
      app_ready=1
      break
    fi
    sleep 2
  done
  if [ "$app_ready" -ne 1 ]; then
    echo "Application proxy did not become healthy at ${APP_BASE_URL}" >&2
    exit 1
  fi
  curl -fsS "${APP_BASE_URL}/api/grafana/api/dashboards/uid/demo-dashboard" \
    | grep -Eq '"uid"[[:space:]]*:[[:space:]]*"demo-dashboard"'
  curl -fsS "${APP_BASE_URL}/dashboard" | grep -q 'demo-dashboard'
fi

echo "Grafana validation passed"
```

Run `chmod +x scripts/verify-grafana.sh`.

- [ ] **Step 2: Replace the canonical Compose file with the cleaned Grafana 13 stack**

Set `examples/docker-compose.yml` to this structure:

```yaml
services:
  grafana:
    image: grafana/grafana:13.1.3
    container_name: grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SERVER_ROOT_URL=%(protocol)s://%(domain)s:%(http_port)s/api/grafana
      - GF_SERVER_SERVE_FROM_SUB_PATH=true
      - GF_SECURITY_ALLOW_EMBEDDING=true
      - GF_SECURITY_COOKIE_SAMESITE=none
      - GF_SECURITY_COOKIE_SECURE=false
      - GF_AUTH_PROXY_ENABLED=true
      - GF_AUTH_PROXY_HEADER_NAME=X-WEBAUTH-USER
      - GF_AUTH_PROXY_HEADER_PROPERTY=username
      - GF_AUTH_PROXY_AUTO_SIGN_UP=true
      - GF_AUTH_PROXY_HEADERS=Role:X-WEBAUTH-ROLE
      - GF_AUTH_PROXY_ENABLE_LOGIN_TOKEN=true
      - GF_AUTH_DISABLE_LOGIN_FORM=true
      - GF_LOG_LEVEL=info
      - GF_DASHBOARDS_DEFAULT_HOME_DASHBOARD_PATH=/etc/grafana/provisioning/dashboards/json/demo-dashboard.json
      - GF_USER_DEFAULT_THEME=dark
    volumes:
      - ./provisioning:/etc/grafana/provisioning:ro
      - grafana-data:/var/lib/grafana
    networks:
      - grafana-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped

networks:
  grafana-network:

volumes:
  grafana-data:
```

This intentionally removes the obsolete top-level Compose `version`, invalid `GF_SERVER_ALLOW_EMBEDDING`, and secure-cookie setting that conflicts with local HTTP.

- [ ] **Step 3: Delete duplicated sandbox infrastructure**

Run:

```bash
git rm sandbox/docker-compose.yml
git rm -r sandbox/provisioning
```

Expected: the only tracked Compose and provisioning owner is `examples/`.

- [ ] **Step 4: Rewrite the sandbox quick-start script around repository paths**

Replace `sandbox/quick-start.sh` with a Bash script that implements this exact order:

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
EXAMPLES_DIR="$REPO_ROOT/examples"
COMPOSE_FILE="$EXAMPLES_DIR/docker-compose.yml"

fail() {
  echo "Error: $*" >&2
  exit 1
}

command -v node >/dev/null 2>&1 || fail "Node.js is required"
command -v npm >/dev/null 2>&1 || fail "npm is required"
command -v curl >/dev/null 2>&1 || fail "curl is required"
command -v docker >/dev/null 2>&1 || fail "Docker is required"
docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 is required"

IFS=. read -r node_major node_minor node_patch <<EOF
$(node -p 'process.versions.node')
EOF
node_patch="${node_patch%%-*}"
node_allowed=0
if [ "$node_major" -eq 22 ] && { [ "$node_minor" -gt 22 ] || { [ "$node_minor" -eq 22 ] && [ "$node_patch" -ge 2 ]; }; }; then
  node_allowed=1
elif [ "$node_major" -eq 24 ] && { [ "$node_minor" -gt 15 ] || { [ "$node_minor" -eq 15 ] && [ "$node_patch" -ge 0 ]; }; }; then
  node_allowed=1
elif [ "$node_major" -ge 26 ]; then
  node_allowed=1
fi
[ "$node_allowed" -eq 1 ] || fail "Node.js ^22.22.2 || ^24.15.0 || >=26.0.0 is required"

IFS=. read -r npm_major npm_minor npm_patch <<EOF
$(npm --version)
EOF
npm_patch="${npm_patch%%-*}"
[ "$npm_major" -eq 12 ] || fail "npm 12.0.2 or a newer npm 12 patch is required"
if [ "$npm_minor" -eq 0 ] && [ "$npm_patch" -lt 2 ]; then
  fail "npm 12.0.2 or newer is required"
fi

compose() {
  docker compose --project-directory "$EXAMPLES_DIR" -f "$COMPOSE_FILE" "$@"
}

echo "Installing and building the root package..."
(cd "$REPO_ROOT" && npm ci && npm run build)

echo "Installing the sandbox..."
(cd "$SCRIPT_DIR" && npm ci)

if [ ! -f "$SCRIPT_DIR/.env" ]; then
  cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
  echo "Created sandbox/.env"
fi

if [ "${KEEP_GRAFANA_DATA:-0}" != "1" ]; then
  compose down -v >/dev/null 2>&1 || true
fi

compose up -d
GRAFANA_BASE_URL=http://localhost:3001/api/grafana "$REPO_ROOT/scripts/verify-grafana.sh"

echo "Sandbox is ready at http://localhost:3000"
echo "Stop Grafana with: docker compose --project-directory \"$EXAMPLES_DIR\" -f \"$COMPOSE_FILE\" down"
cd "$SCRIPT_DIR"
exec npm run dev
```

Run `chmod +x sandbox/quick-start.sh`. Do not restore `docker-compose` v1 fallback, `lsof`, macOS-only port probing, or duplicated validation logic.

- [ ] **Step 5: Point CI runtime smoke to the canonical stack and verifier**

In the sandbox-only block of `.github/workflows/test.yml`:

- Start `examples/docker-compose.yml`, not the deleted sandbox file.
- Use `docker compose -f examples/docker-compose.yml config --quiet` before startup.
- Start the built sandbox with `npm run start --prefix sandbox -- --port 3000`.
- Set a cleanup trap that kills the app and runs `docker compose -f examples/docker-compose.yml down -v`.
- Run `APP_BASE_URL=http://localhost:3000 scripts/verify-grafana.sh`.

Keep the runtime smoke restricted to the sandbox on Node 22.22.2.

- [ ] **Step 6: Verify Compose, shell, Grafana, and proxied rendering**

Run:

```bash
bash -n sandbox/quick-start.sh
bash -n scripts/verify-grafana.sh
docker compose -f examples/docker-compose.yml config --quiet
docker compose -f examples/docker-compose.yml pull grafana
docker compose -f examples/docker-compose.yml down -v || true
docker compose -f examples/docker-compose.yml up -d
GRAFANA_BASE_URL=http://localhost:3001/api/grafana scripts/verify-grafana.sh
```

Then start the built sandbox in the background and validate the proxy:

```bash
cp -n sandbox/.env.example sandbox/.env || true
npm run build --prefix sandbox
npm run start --prefix sandbox -- --port 3000 > "$JCODE_SCRATCH_DIR/sandbox.log" 2>&1 &
APP_PID=$!
trap 'kill "$APP_PID" 2>/dev/null || true; docker compose -f examples/docker-compose.yml down -v' EXIT
APP_BASE_URL=http://localhost:3000 scripts/verify-grafana.sh
```

Expected: Grafana 13.1.3 passes health, datasource, dashboard, TestData query, application proxy, and dashboard-render checks.

- [ ] **Step 7: Commit the canonical Grafana task**

```bash
git add examples/docker-compose.yml sandbox/quick-start.sh scripts/verify-grafana.sh .github/workflows/test.yml
git add -u sandbox/docker-compose.yml sandbox/provisioning
git commit -m "chore(sandbox): consolidate Grafana test infrastructure"
```

Expected: Stage 2 is independently green and contains one canonical local Grafana stack.

---

# Stage 3: Documentation Cleanup and Consolidation

### Task 5: Add local link validation and delete historical documentation

**Files:**

- Create: `scripts/check-markdown-links.mjs`
- Modify: `package.json:25-34`
- Delete: all tracked `docs/ai-setup/*`
- Delete: `docs/dx/phase2-api-helper-guardrails.md`

**Interfaces:**

- Consumes: tracked Markdown paths and GitHub-style heading anchors.
- Produces: a dependency-free `npm run docs:check` gate and removal of 35 unmaintained planning or QA artifacts.

- [ ] **Step 1: Add a tracked-Markdown link checker**

Create `scripts/check-markdown-links.mjs`:

```js
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, relative, resolve } from 'node:path'

const repositoryRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
}).trim()
const anchorCache = new Map()

function trackedMarkdownFiles() {
  const output = execFileSync('git', ['ls-files', '*.md'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  }).trim()
  return output ? output.split('\n').map((file) => resolve(repositoryRoot, file)) : []
}

function withoutFencedCode(markdown) {
  let fence = null
  return markdown
    .split('\n')
    .map((line) => {
      const match = line.match(/^ {0,3}(`{3,}|~{3,})/)
      if (match) {
        const marker = match[1][0]
        if (fence === null) fence = marker
        else if (fence === marker) fence = null
        return ''
      }
      return fence === null ? line : ''
    })
    .join('\n')
}

function githubSlug(value) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .replace(/\s+/g, '-')
}

function anchorsFor(markdownFile) {
  if (anchorCache.has(markdownFile)) return anchorCache.get(markdownFile)

  const markdown = withoutFencedCode(readFileSync(markdownFile, 'utf8'))
  const anchors = new Set()
  const duplicates = new Map()
  for (const line of markdown.split('\n')) {
    const match = line.match(/^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/)
    if (!match) continue
    const base = githubSlug(match[1])
    const duplicate = duplicates.get(base) ?? 0
    anchors.add(duplicate === 0 ? base : `${base}-${duplicate}`)
    duplicates.set(base, duplicate + 1)
  }
  anchorCache.set(markdownFile, anchors)
  return anchors
}

function markdownTargets(markdown) {
  const targets = []
  const patterns = [
    /!?\[[^\]]*\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\s*\)/g,
    /^\s*\[[^\]]+\]:\s*(<[^>]+>|\S+)/gm,
  ]

  for (const pattern of patterns) {
    for (const match of markdown.matchAll(pattern)) {
      targets.push({ index: match.index ?? 0, target: match[1] })
    }
  }
  return targets
}

function checkMarkdownFile(markdownFile) {
  const absoluteSource = resolve(markdownFile)
  if (!existsSync(absoluteSource)) {
    return [`${relative(repositoryRoot, absoluteSource)}:1 -> file missing`]
  }

  const markdown = withoutFencedCode(readFileSync(absoluteSource, 'utf8'))
  const failures = []
  for (const { index, target: rawTarget } of markdownTargets(markdown)) {
    const line = markdown.slice(0, index).split('\n').length
    const target = rawTarget.replace(/^<|>$/g, '')
    if (/^[a-z][a-z\d+.-]*:/i.test(target) || target.startsWith('//')) continue

    const hashIndex = target.indexOf('#')
    const rawPath = (hashIndex === -1 ? target : target.slice(0, hashIndex)).split('?')[0]
    const rawFragment = hashIndex === -1 ? '' : target.slice(hashIndex + 1)
    let decodedPath
    let decodedFragment
    try {
      decodedPath = decodeURIComponent(rawPath)
      decodedFragment = decodeURIComponent(rawFragment)
    } catch {
      failures.push(
        `${relative(repositoryRoot, absoluteSource)}:${line} -> ${target} (invalid URI encoding)`
      )
      continue
    }

    let resolvedTarget = decodedPath
      ? decodedPath.startsWith('/')
        ? resolve(repositoryRoot, `.${decodedPath}`)
        : resolve(dirname(absoluteSource), decodedPath)
      : absoluteSource

    if (!existsSync(resolvedTarget)) {
      failures.push(
        `${relative(repositoryRoot, absoluteSource)}:${line} -> ${target} (target missing)`
      )
      continue
    }

    if (statSync(resolvedTarget).isDirectory()) {
      const readme = resolve(resolvedTarget, 'README.md')
      if (!decodedFragment || !existsSync(readme)) continue
      resolvedTarget = readme
    }

    if (decodedFragment && extname(resolvedTarget).toLowerCase() === '.md') {
      const anchors = anchorsFor(resolvedTarget)
      const exact = decodedFragment.toLowerCase()
      const normalized = githubSlug(decodedFragment)
      if (!anchors.has(exact) && !anchors.has(normalized)) {
        failures.push(
          `${relative(repositoryRoot, absoluteSource)}:${line} -> ${target} (anchor missing)`
        )
      }
    }
  }
  return failures
}

const requestedFiles = process.argv.slice(2)
const markdownFiles = requestedFiles.length > 0
  ? requestedFiles.map((file) => resolve(process.cwd(), file))
  : trackedMarkdownFiles()
const failures = markdownFiles.flatMap(checkMarkdownFile)

if (failures.length > 0) {
  for (const failure of failures) console.error(failure)
  process.exit(1)
}

console.log(`Checked ${markdownFiles.length} Markdown files`)
```

Add to `package.json`:

```json
"docs:check": "node scripts/check-markdown-links.mjs"
```

Run `npm run docs:check` before deleting anything. Fix parser defects, not documentation content, if a valid existing link is falsely rejected.

- [ ] **Step 2: Delete the exact historical set**

Run:

```bash
test "$(git ls-files 'docs/ai-setup/**' 'docs/dx/**' | wc -l | tr -d ' ')" = "35"
git rm -r docs/ai-setup docs/dx
```

Expected: 34 AI authoring/task/QA files and one deferred nonexistent-API guardrail are removed.

- [ ] **Step 3: Prove no maintained document depends on deleted paths**

Run:

```bash
if rg -n 'docs/(ai-setup|dx)|phase2-api-helper-guardrails|createGrafanaProxyHandler' \
  --glob '!docs/2026-08-08-repository-modernization-design.md' \
  --glob '!docs/2026-08-08-repository-modernization-plan.md'; then
  echo "maintained references to deleted documentation remain"
  exit 1
fi
npm run docs:check
```

Expected: no maintained references and all remaining local links resolve.

- [ ] **Step 4: Commit the deletion and validation gate**

```bash
git add package.json scripts/check-markdown-links.mjs
git add -u docs/ai-setup docs/dx
git commit -m "docs: remove obsolete planning artifacts"
```

Expected: the commit deletes only historical docs and adds the permanent link gate.

---

### Task 6: Rewrite retained documentation around one owner per fact

**Files:**

- Modify: `README.md`
- Modify: `GETTING_STARTED.md`
- Modify: `TROUBLESHOOTING.md`
- Modify: `CONTRIBUTING.md`
- Modify: `RELEASE_CHECKLIST.md`
- Modify: `examples/README.md`
- Modify: `examples/grafana/README.md`
- Modify: `examples/basic/README.md`
- Modify: `examples/nextauth/README.md`
- Modify: `examples/custom-session/README.md`
- Modify: `sandbox/README.md`
- Review without expected content changes: `docs/API_REFERENCE.md`

**Interfaces:**

- Consumes: final Stage 1 and Stage 2 commands, versions, paths, and canonical Grafana stack.
- Produces: concise product documentation with executable clean-clone workflows, no stale logs or historical gates, and explicit separation between support floors and example versions.

- [ ] **Step 1: Rewrite the root README as the concise landing page**

Use exactly these responsibilities and headings:

```text
# next-grafana-auth
## Why use it
## Install
## Minimal proxy route
## Minimal dashboard component
## Critical security and path invariants
## Compatibility
## Documentation
## License
```

Required facts:

- Runtime dependencies remain zero.
- Consumer floors remain Node 18.18, Next 15, React 18, and Grafana 11.6.
- Current repository examples use Next 16.3.0, React 19.2.8, and Grafana 13.1.3.
- The proxy example derives identity on the server and passes `(await params).path`.
- The component example imports from `next-grafana-auth/component`.
- Keep one compact warning about inbound identity, Authorization, and Cookie headers.
- Link once each to Getting Started, API Reference, examples, sandbox, troubleshooting, security, support, and the optional installable skill.

Delete duplicated TL;DR/resources/troubleshooting sections and repeated link maps.

- [ ] **Step 2: Turn Getting Started into one integration workflow plus auth routing**

Use this order:

```text
# Getting Started
## Prerequisites
## 1. Install the package
## 2. Create the catch-all proxy route
## 3. Render the dashboard
## 4. Configure Grafana auth-proxy and sub-path
## 5. Verify the integration
## Choose an authentication example
## Next steps
```

Include one complete secure route example, one component example, the two topology-specific `GRAFANA_INTERNAL_URL` values, and binary health/render checks. Replace the four duplicated path tutorials with a short table linking Basic, NextAuth, Custom Session, and Sandbox.

- [ ] **Step 3: Make troubleshooting symptom-first and non-duplicative**

Keep one fast triage table mapping these symptoms to checks and fixes:

- `401/403`: server session and role mapping.
- `404`: route, `baseUrl`, `pathPrefix`, and Grafana `root_url` alignment.
- `504` or stuck loading: upstream reachability before timeout tuning.
- Blank iframe or login form: embedding, auth-proxy, cookie/protocol settings.
- `ECONNREFUSED` or `ENOTFOUND`: topology-specific internal URL.
- Missing datasource/dashboard: canonical provisioning and volume reset.

Use exact verification commands and link to the canonical Grafana guide. Remove generic tutorials and repeated security prose already owned by README or SECURITY.

- [ ] **Step 4: Make every clean-clone example command executable**

Use this exact clean-clone block in `examples/basic/README.md`:

```bash
npm ci
npm run build
docker compose -f examples/docker-compose.yml up -d
npm ci --prefix examples/basic
cp examples/basic/.env.example examples/basic/.env
npm run dev --prefix examples/basic
```

Use this exact clean-clone block in `examples/custom-session/README.md`:

```bash
npm ci
npm run build
docker compose -f examples/docker-compose.yml up -d
npm ci --prefix examples/custom-session
cp examples/custom-session/.env.example examples/custom-session/.env
npm run dev --prefix examples/custom-session
```

Use this exact clean-clone block in `examples/nextauth/README.md`:

```bash
npm ci
npm run build
docker compose -f examples/docker-compose.yml up -d
npm ci --prefix examples/nextauth
cp examples/nextauth/.env.example examples/nextauth/.env
openssl rand -base64 32
npm run dev --prefix examples/nextauth
```

Tell the reader to copy the generated secret into `NEXTAUTH_SECRET` in `examples/nextauth/.env` before the final command. Keep only example-specific auth flow, demo credentials, important files, production caveats, and teardown. Remove code statistics, stale log expectations, broad OAuth/database tutorials, repeated panel inventories, and claims that demo credential flows are production-ready.

The Custom Session README must explicitly say its credentials and in-memory store are local demo behavior. Its production checklist must name durable storage, password hashing, CSRF protection, rate limiting, and session rotation.

- [ ] **Step 5: Rewrite the canonical Grafana and sandbox guides**

`examples/grafana/README.md` owns:

- Grafana 13.1.3 as the current example image, not the support floor.
- `examples/docker-compose.yml` and `examples/provisioning/` as canonical owners.
- Compose v2 start, config validation, verifier command, logs, stop, and volume-reset commands.
- Auth-proxy and sub-path settings, plus the production whitelist warning.

`sandbox/README.md` owns:

- Contributor Node range and npm 12 requirement because it builds the root package.
- Docker Compose v2 and curl prerequisites.
- `./sandbox/quick-start.sh` from repository root.
- What the script validates, how to keep Grafana data, manual validation, and canonical teardown.
- No sandbox-local Compose or provisioning tree, no `lsof`, no stale proxy-log strings, and no copied troubleshooting catalog.

- [ ] **Step 6: Tighten contributor and release documentation**

Update `CONTRIBUTING.md` to include:

```bash
npm ci
npm run typecheck
npm run lint
npm run test:run
npm run build
npm run smoke:dist
npm run docs:check
npm audit --audit-level=high
npm pack --dry-run
```

State the contributor Node range and npm 12.0.2 requirement, keep the consumer Node floor separate, and show root build before application installs.

Reduce `RELEASE_CHECKLIST.md` to release-only checkboxes: clean install, root suite, docs/link check, examples, Grafana smoke, high audit, dry-run pack, version/tag match, signed tag, workflow publication, npm package smoke, and post-release monitoring. Delete the generic Git/GPG tutorial, historical docs acceptance gates, and duplicate tag explanations.

- [ ] **Step 7: Validate retained docs and ownership boundaries**

Run:

```bash
npm run docs:check
rg -n 'sandbox/docker-compose|sandbox/provisioning|grafana-sandbox|GF_SERVER_ALLOW_EMBEDDING|npm@11\.13\.0|\^20\.19\.0|\^22\.13\.0' \
  README.md GETTING_STARTED.md TROUBLESHOOTING.md CONTRIBUTING.md RELEASE_CHECKLIST.md examples sandbox .agents
rg -n 'Code Statistics|Proxying to Grafana|docs acceptance gates|phase2|DOC-[0-9]+' \
  README.md GETTING_STARTED.md TROUBLESHOOTING.md CONTRIBUTING.md RELEASE_CHECKLIST.md examples sandbox
```

Expected: both stale-content searches return no maintained-document matches. Support-floor mentions of Grafana 11.6, Next 15, React 18, and Node 18.18 remain where they describe published compatibility, not example versions.

- [ ] **Step 8: Commit the retained documentation rewrite**

```bash
git add README.md GETTING_STARTED.md TROUBLESHOOTING.md CONTRIBUTING.md RELEASE_CHECKLIST.md examples/README.md examples/grafana/README.md examples/basic/README.md examples/nextauth/README.md examples/custom-session/README.md sandbox/README.md
git commit -m "docs: consolidate setup and maintenance guidance"
```

Expected: Stage 3 is independently link-clean and every documented clean-clone path maps to existing files and commands.

---

# Stage 4: Safe Source, Test, and Example Cleanup

### Task 7: Remove internal-only root source and the skipped placeholder

**Files:**

- Modify: `src/index.ts`
- Modify: `src/types.ts`
- Modify: `src/utils.ts`
- Modify: `src/component.tsx`
- Modify: `tests/component.test.tsx`

**Interfaces:**

- Consumes: the exact-export smoke script, handler/component regression suites, generated declaration build, and package dry-run.
- Produces: the same documented API and behavior with less internal surface and no skipped placeholder test.

- [ ] **Step 1: Lock current public exports and focused behavior**

Run:

```bash
npm run build
npm run smoke:dist
npx vitest run tests/handler.test.ts tests/integration.test.ts tests/component.test.tsx tests/build-config.test.ts
cp dist/index.d.ts "$JCODE_SCRATCH_DIR/index.before.d.ts"
```

Expected: focused tests pass with one skipped component placeholder; the smoke script records exactly six root runtime exports.

- [ ] **Step 2: Remove the internal proxy handler alias without changing the function signature**

In `src/types.ts`, delete only `ProxyHandlerFunction` and its internal comment.

In `src/index.ts`:

- Import only `GrafanaProxyConfig` from `./types`.
- Change the declaration to an inferred async function value with explicit parameters and return type:

```ts
export const handleGrafanaProxy = async (
  request: Request,
  config: GrafanaProxyConfig,
  pathParams?: string[]
): Promise<Response> => {
```

Keep the function body unchanged except for comments that only restate the next line. Preserve security rationale comments, especially identity-header injection, connection headers, redirect handling, bodyless responses, and Set-Cookie compatibility.

- [ ] **Step 3: Remove the internal-only path export and redundant class normalization**

In `src/utils.ts`, change:

```ts
export function stripLeadingSlash(path: string): string {
```

to:

```ts
function stripLeadingSlash(path: string): string {
```

Do not change `joinPaths` behavior or root utility exports.

In `src/component.tsx`, delete `containerClassName` and render:

```tsx
<div className={className} style={containerStyles} aria-busy={isLoadingState}>
```

Keep iframe sandbox resolution, event handlers, loading/timeout/error states, retry behavior, ARIA roles, and timing logic unchanged.

- [ ] **Step 4: Delete the empty skipped iframe-error placeholder**

Delete the explanatory React 18/jsdom comment and:

```ts
it.skip('should show error overlay on iframe error', () => {})
```

Do not remove the component's error state or `onError` handler because those are documented public behavior.

- [ ] **Step 5: Verify declarations, exports, behavior, and skipped-test removal**

Run:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run smoke:dist
npm pack --dry-run
if rg -n 'ProxyHandlerFunction|export function stripLeadingSlash|it\.skip|describe\.skip' src tests dist; then
  echo "removed internal or skipped surface remains"
  exit 1
fi
```

Inspect `dist/index.d.ts` and confirm `handleGrafanaProxy` still has:

```ts
(request: Request, config: GrafanaProxyConfig, pathParams?: string[]) => Promise<Response>
```

Expected: all tests pass with zero skips; public runtime export names are unchanged; CJS, ESM, declarations, and package contents remain valid.

- [ ] **Step 6: Commit the root source cleanup**

```bash
git add src/index.ts src/types.ts src/utils.ts src/component.tsx tests/component.test.tsx
git commit -m "refactor: remove internal-only package surface"
```

Expected: no proxy behavior change and no public API removal.

---

### Task 8: Simplify and behavior-lock the custom-session demo

**Files:**

- Create: `tests/custom-session.test.ts`
- Modify: `examples/custom-session/app/lib/session.ts`
- Modify: `examples/custom-session/app/api/auth/signin/route.ts`
- Modify: `examples/custom-session/app/api/auth/signout/route.ts`
- Modify: `examples/custom-session/app/api/auth/user/route.ts`
- Modify: `examples/custom-session/app/api/grafana/[...path]/route.ts`

**Interfaces:**

- Consumes: the existing `sessionId` cookie name, demo users and passwords, 24-hour TTL, and route response behavior.
- Produces: synchronous in-memory demo helpers using UUID session IDs, only live fields, lazy expiration, no global timer, and unchanged HTTP behavior.

- [ ] **Step 1: Write regression tests before changing the session store**

Create `tests/custom-session.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createSession,
  deleteSession,
  getUserBySessionId,
} from '../examples/custom-session/app/lib/session'

afterEach(() => {
  vi.useRealTimers()
})

describe('custom-session demo store', () => {
  it('creates UUID sessions for valid demo credentials', async () => {
    const sessionId = await createSession('admin@example.com', 'admin123')

    expect(sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
    expect(await getUserBySessionId(sessionId)).toEqual({
      email: 'admin@example.com',
      role: 'Admin',
    })
    await deleteSession(sessionId)
  })

  it('deletes an expired session during lookup', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-08T00:00:00Z'))
    const sessionId = await createSession('user@example.com', 'user123')

    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1)

    expect(await getUserBySessionId(sessionId)).toBeNull()
  })

  it('deletes a session explicitly', async () => {
    const sessionId = await createSession('user@example.com', 'user123')
    await deleteSession(sessionId)

    expect(await getUserBySessionId(sessionId)).toBeNull()
  })

  it('rejects invalid demo credentials', async () => {
    await expect(
      Promise.resolve().then(() => createSession('admin@example.com', 'wrong'))
    ).rejects.toThrow('Invalid credentials')
  })
})
```

Run:

```bash
npx vitest run tests/custom-session.test.ts
```

Expected before implementation: the UUID assertion fails because the current session ID uses timestamp plus `Math.random()`.

- [ ] **Step 2: Replace the session store with the minimal synchronous model**

Replace `examples/custom-session/app/lib/session.ts` with:

```ts
interface User {
  email: string
  role: 'Admin' | 'Editor' | 'Viewer'
}

interface DemoAccount {
  password: string
  user: User
}

interface Session {
  user: User
  expiresAt: number
}

const SESSION_TTL_MS = 24 * 60 * 60 * 1000
const sessions = new Map<string, Session>()
const demoAccounts = new Map<string, DemoAccount>([
  [
    'admin@example.com',
    {
      password: 'admin123',
      user: { email: 'admin@example.com', role: 'Admin' },
    },
  ],
  [
    'user@example.com',
    {
      password: 'user123',
      user: { email: 'user@example.com', role: 'Viewer' },
    },
  ],
])

function deleteExpiredSessions(now: number): void {
  for (const [sessionId, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(sessionId)
  }
}

export function getUserBySessionId(sessionId: string | undefined): User | null {
  if (!sessionId) return null

  const session = sessions.get(sessionId)
  if (!session) return null
  if (session.expiresAt <= Date.now()) {
    sessions.delete(sessionId)
    return null
  }

  return session.user
}

export function createSession(email: string, password: string): string {
  const account = demoAccounts.get(email)
  if (!account || account.password !== password) {
    throw new Error('Invalid credentials')
  }

  const now = Date.now()
  deleteExpiredSessions(now)
  const sessionId = crypto.randomUUID()
  sessions.set(sessionId, {
    user: account.user,
    expiresAt: now + SESSION_TTL_MS,
  })
  return sessionId
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId)
}
```

This keeps credentials and storage intentionally local to the demo. Do not add persistence, hashing dependencies, a timer, or shared auth abstractions.

- [ ] **Step 3: Remove unnecessary awaits from the four callers**

Change only helper invocations:

```ts
const sessionId = createSession(email, password)
deleteSession(sessionId)
const user = getUserBySessionId(sessionId)
```

Keep route functions async where Next.js `cookies()`, route `params`, or `handleGrafanaProxy` require it. Preserve cookies, status codes, response bodies, and proxy method exports.

- [ ] **Step 4: Run the red/green test and static cleanup checks**

Run:

```bash
npx vitest run tests/custom-session.test.ts
if rg -n 'Math\.random|setInterval|createdAt|userId|export async function (createSession|deleteSession|getUserBySessionId)|await (createSession|deleteSession|getUserBySessionId)' examples/custom-session; then
  echo "custom-session cleanup is incomplete"
  exit 1
fi
```

Expected: four tests pass and the static search returns no matches.

- [ ] **Step 5: Run the complete Stage 4 gate**

Run:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run smoke:dist
npm run docs:check
npm audit --audit-level=high
npm pack --dry-run
bash -n sandbox/quick-start.sh
bash -n scripts/verify-grafana.sh
docker compose -f examples/docker-compose.yml config --quiet

for app in examples/basic examples/custom-session examples/nextauth sandbox; do
  rm -rf "$app/node_modules" "$app/.next"
  npx --yes npm@12.0.2 ci --prefix "$app"
  GRAFANA_INTERNAL_URL=http://localhost:3001 \
  NEXTAUTH_SECRET=sandbox-ci-secret \
  NEXTAUTH_URL=http://localhost:3000 \
    npx --yes npm@12.0.2 run build --prefix "$app"
  npx --yes npm@12.0.2 audit --prefix "$app" --audit-level=high --omit=dev
done
```

Repeat the Task 4 Grafana and sandbox runtime smoke. If Docker is unavailable, stop and report the acceptance check as blocked instead of claiming completion. Expected: every root, application, documentation, shell, Compose, audit, package, and runtime gate passes.

- [ ] **Step 6: Commit the custom-session cleanup**

```bash
git add tests/custom-session.test.ts examples/custom-session/app/lib/session.ts examples/custom-session/app/api/auth/signin/route.ts examples/custom-session/app/api/auth/signout/route.ts examples/custom-session/app/api/auth/user/route.ts 'examples/custom-session/app/api/grafana/[...path]/route.ts'
git commit -m "refactor(examples): simplify custom session demo"
```

Expected: Stage 4 is independently green and the demo no longer contains insecure randomness, unused session fields, async-only wrappers, or a global interval.

---

## Final Acceptance Checklist

Run after all eight tasks, from a clean working tree and npm 12 contributor runtime:

```bash
git diff --check
git status --short
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run smoke:dist
npm run docs:check
npm audit --audit-level=high
npm pack --dry-run
```

Verify all of the following:

1. Root `npm outdated --json` reports only TypeScript, current `5.9.3`.
2. Root and all four application high-severity audits pass.
3. Any remaining root audit finding is only the known low esbuild development-server path owned by tsup and not used by this repository.
4. Root tests report zero skipped tests.
5. CommonJS and ESM smoke passes locally and in CI on Node 18.18.0 and 20.9.0 without installing development dependencies.
6. All four applications use Next.js 16.3.0 and React 19.2.8, have no PostCSS/Sharp overrides, and pass clean npm 12 installs and production builds.
7. NextAuth remains on the latest stable 4.x line and passes its Next.js 16/React 19 build.
8. Grafana 13.1.3 passes health, datasource, dashboard, query, application proxy, and dashboard-render checks.
9. `examples/docker-compose.yml` and `examples/provisioning/` are the only local Grafana infrastructure owners.
10. Exactly 35 historical docs are gone; all retained local links and anchors resolve.
11. `ProxyHandlerFunction`, exported `stripLeadingSlash`, the empty skipped test, the global session timer, `Math.random()` session IDs, and unused session fields are gone.
12. `package.json` version, consumer engine, peer ranges, package export map, runtime dependency count, and documented public exports are unchanged.
13. No generated `.next`, `dist`, `node_modules`, scratch files, manual lock edits, or unrelated changes are staged.
14. Hosted CI matrices pass on Node 22.22.2, 24.15.0, and 26.x; consumer smoke passes on Node 18.18.0 and 20.9.0.

## Requirement Traceability

| Design requirement | Implemented by |
|---|---|
| Latest compatible root dependencies and TypeScript hold | Task 1 |
| Contributor Node/npm policy, old consumer runtime smoke | Task 2 |
| Dependabot root, apps, Actions, and Docker coverage | Task 2 |
| Next.js 16, React 19, NextAuth stable, override removal | Task 3 |
| Grafana 13 and one canonical stack | Task 4 |
| Clean-clone sandbox automation and runtime checks | Task 4 |
| Delete 35 historical docs and validate links | Task 5 |
| One documentation owner per setup fact | Task 6 |
| Internal root source and skipped-test removal | Task 7 |
| Custom-session UUID, field, timer, and async cleanup | Task 8 |
| Public API and proxy security preservation | Tasks 2, 7, and final acceptance |
