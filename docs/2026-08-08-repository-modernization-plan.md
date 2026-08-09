# Repository Modernization Implementation Plan

> **Emergency handoff status:** Draft. Before implementation, finish the independent-review follow-ups for executable clean-clone example workflows, Custom Session method-export coverage, fail-fast documentation commands, exact audit assertions, and complete public package contract assertions.
>
> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Use `superpowers:test-driven-development` for each red/green cycle and `superpowers:verification-before-completion` before claiming success. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade every direct root and application dependency to the latest supported stable release, consolidate local Grafana infrastructure, and remove obsolete documentation and demonstrably unnecessary code without changing the published API or proxy security behavior.

**Architecture:** Execute four sequential stages: root toolchain, applications and Grafana, documentation, then safe code cleanup. Each stage has its own clean-install and behavior gate, and each task ends in a focused commit. The package keeps its broad consumer contract while repository-owned contributor jobs use the newer Node and npm versions required by current development tools.

**Tech Stack:** npm 12 lockfile v3, Node.js contributor matrix `22.22.2`, `24.15.0`, and `26.x`, TypeScript 5.9.3, ESLint 10.8, `typescript-eslint` 8.66, Vitest 4.1, jsdom 30, Next.js 16.3.0, React 19.2.8, NextAuth 4.24.15, Grafana 13.1.3, Docker Compose v2, GitHub Actions, Dependabot.

## Global Constraints

- Preserve the published consumer engine exactly as Node.js `>=18.18.0`.
- Preserve peer minimums exactly as Next.js `>=15.0.0`, React `>=18.0.0`, and ReactDOM `>=18.0.0`.
- Preserve zero runtime dependencies, CommonJS and ESM entry points, package version `1.0.3`, and every documented public export.
- Scope dependency work to the exactly five tracked `package.json` files. Do not modify or stage the ignored local-only `examples/prom-client/` tree.
- Contributor tooling requires `^22.22.2 || ^24.15.0 || >=26.0.0` and npm `12.0.2` or a newer compatible npm 12 patch.
- Keep TypeScript at `5.9.3`. It is the only compatibility hold because `typescript-eslint` 8.66.0 supports TypeScript `<6.1.0`, not TypeScript 7.0.2.
- Use Next.js `16.3.0`, React `19.2.8`, ReactDOM `19.2.8`, NextAuth `^4.24.15`, and Grafana `13.1.3`, unless a newer stable patch is re-verified immediately before implementation.
- Never use `npm audit fix --force`, `--legacy-peer-deps`, or manual lockfile edits.
- Do not accept the non-forced audit-fix proposal that downgrades esbuild from 0.27.7 to 0.27.2. Keep the latest tsup-resolved line and the exact low-advisory assertion until tsup declares a fixed newer esbuild range.
- Do not change proxy URL construction, trusted identity headers, header allowlists, Set-Cookie handling, redirect behavior, request bodies, timeout behavior, iframe states, retry behavior, sandbox semantics, or accessibility behavior.
- Do not add the deferred `createGrafanaProxyHandler` abstraction or introduce shared application-route abstractions.
- Stop at the first failing clean install, build, audit, declaration check, Compose check, or runtime smoke. Fix or revert that task before proceeding.
- Begin every multi-command verification or acceptance block with `set -euo pipefail`. Capture an expected nonzero status explicitly and assert its exact value before continuing.
- Keep each commit limited to its task. Do not include ignored local tool data, generated `.next` output, `node_modules`, `dist`, or unrelated working-tree changes.

---

## Planned File Map

### Create

- `scripts/smoke-built-package.mjs`: dependency-free CommonJS and ESM built-artifact smoke test.
- `scripts/verify-example-startup.sh`: focused clean-clone startup smoke for the Basic, Custom Session, and NextAuth documented workflows.
- `scripts/verify-grafana.sh`: canonical health, datasource, dashboard, query, and optional proxied-render validation.
- `scripts/verify-custom-session.sh`: production HTTP regression check for the Custom Session authentication and proxy routes.
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

- Every tracked file under `docs/ai-setup/` and `docs/dx/`, exactly 35 historical files.
- After final acceptance only: `docs/2026-08-08-repository-modernization-design.md` and `docs/2026-08-08-repository-modernization-plan.md`.
- `sandbox/docker-compose.yml`.
- `sandbox/provisioning/datasources/datasource.yml`.
- `sandbox/provisioning/dashboards/dashboard.yml`.
- `sandbox/provisioning/dashboards/json/demo-dashboard.json`.

### Preserve Without Functional Changes

- `.agents/skills/next-grafana-auth/*`, `SECURITY.md`, `SUPPORT.md`, `CODE_OF_CONDUCT.md`, all public package exports, all example route boundaries, and all canonical Grafana provisioning files under `examples/provisioning/`.
- Ignored local-only work under `examples/prom-client/` and `docs/superpowers/`; verify ignore status, but never add, update, or delete it as part of this plan.

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
set -euo pipefail
npm run lint
npm run typecheck
npm run test:run
npm run build
baseline_audit_status=0
npm audit --audit-level=high || baseline_audit_status=$?
test "$baseline_audit_status" -eq 1
baseline_outdated_status=0
npm outdated --long || baseline_outdated_status=$?
test "$baseline_outdated_status" -eq 1
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
  }
}
```

Do not add a hard-failing `devEngines.packageManager` entry. Current Node releases can bundle npm 11, and npm evaluates that field before `npx npm@12.0.2` can bootstrap the declared manager. The exact `packageManager` field, every lockfile command, CI's global npm pin, the quick-start preflight, and final version assertions provide executable npm 12 enforcement without that circular failure.

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
set -euo pipefail
rm -rf node_modules
npx --yes npm@12.0.2 install --package-lock-only
npx --yes npm@12.0.2 ci
```

Expected: lockfile version 3, no unsupported-engine warning, current Next.js and React peer resolutions, and no invalid or extraneous direct dependencies.

- [ ] **Step 7: Verify the root dependency contract**

Run:

```bash
set -euo pipefail
npx --yes npm@12.0.2 ls --depth=0
npx --yes npm@12.0.2 audit --audit-level=high

root_audit="$JCODE_SCRATCH_DIR/root-audit.json"
root_audit_status=0
npx --yes npm@12.0.2 audit --json > "$root_audit" || root_audit_status=$?
if [ "$root_audit_status" -ne 0 ] && [ "$root_audit_status" -ne 1 ]; then
  echo "unexpected npm audit exit status: $root_audit_status" >&2
  exit 1
fi
node - "$root_audit" <<'NODE'
const assert = require('node:assert/strict')
const fs = require('node:fs')
const report = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const counts = report.metadata?.vulnerabilities ?? {}
assert.equal(counts.high ?? 0, 0, 'high-severity audit findings remain')
assert.equal(counts.critical ?? 0, 0, 'critical audit findings remain')
assert.equal(require('./node_modules/esbuild/package.json').version, '0.27.7')

const names = Object.keys(report.vulnerabilities ?? {})
if (names.length === 0) process.exit(0)
assert.deepEqual(names, ['esbuild'], `unexpected residual audit findings: ${names.join(', ')}`)
const esbuild = report.vulnerabilities.esbuild
assert.equal(esbuild.severity, 'low')
const via = esbuild.via
const advisoryUrls = (Array.isArray(via) ? via : [via])
  .filter((entry) => entry && typeof entry === 'object')
  .map((entry) => entry.url)
assert.ok(
  advisoryUrls.includes('https://github.com/advisories/GHSA-g7r4-m6w7-qqqr'),
  'the residual esbuild finding is not the reviewed development-server advisory'
)
NODE

root_outdated_status=0
npx --yes npm@12.0.2 outdated --json > "$JCODE_SCRATCH_DIR/root-outdated.json" || root_outdated_status=$?
test "$root_outdated_status" -eq 1
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
node <<'NODE'
const assert = require('node:assert/strict')
const pkg = require('./package.json')
assert.equal(pkg.main, './dist/index.js')
assert.equal(pkg.module, './dist/index.mjs')
assert.equal(pkg.types, './dist/index.d.ts')
assert.deepEqual(pkg.dependencies ?? {}, {})
assert.equal(pkg.packageManager, 'npm@12.0.2')
assert.deepEqual(pkg.devEngines, {
  runtime: {
    name: 'node',
    version: '^22.22.2 || ^24.15.0 || >=26.0.0',
    onFail: 'error',
  },
})
assert.deepEqual(pkg.devDependencies, {
  '@eslint/js': '^10.0.1',
  '@testing-library/jest-dom': '^7.0.0',
  '@testing-library/react': '^16.3.2',
  '@types/node': '^26.2.0',
  '@types/react': '^19.2.18',
  '@types/react-dom': '^19.2.4',
  eslint: '^10.8.1',
  jsdom: '^30.0.1',
  tsup: '^8.5.1',
  typescript: '5.9.3',
  'typescript-eslint': '^8.66.0',
  vitest: '^4.1.10',
})
NODE
npm run lint
npm run typecheck
npm run test:run
npm run build
npm pack --dry-run
```

Expected: only TypeScript is outdated; the high audit passes; esbuild resolves to exactly `0.27.7`; a complete JSON audit is either empty or contains only low-severity `GHSA-g7r4-m6w7-qqqr` for esbuild's development server; package entry metadata and all root gates pass; the Vite native-loader warning is absent.

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
- Create: `scripts/verify-example-startup.sh`
- Modify: `package.json:25-33`
- Modify: `.github/workflows/test.yml`
- Modify: `.github/workflows/security.yml`
- Modify: `.github/workflows/release.yml`
- Modify: `.github/dependabot.yml`

**Interfaces:**

- Consumes: the root and `./component` CommonJS, ESM, and declaration artifacts produced by Task 1, plus npm 12 contributor metadata.
- Produces: full contributor matrices on modern Node versions, no-install root-entry consumer smoke checks on the two older supported Node lines, an installed-graph component-entry smoke, executable startup checks for all three documented authentication examples, application and Docker Dependabot coverage, and release validation separated from publication.

- [ ] **Step 1: Add a dependency-free built-package smoke test**

Create `scripts/smoke-built-package.mjs`:

```js
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const componentMode = process.argv.includes('--component')
const entryName = componentMode ? 'component' : 'index'
const commonJs = require(resolve(repositoryRoot, `dist/${entryName}.js`))
const esModule = await import(
  pathToFileURL(resolve(repositoryRoot, `dist/${entryName}.mjs`)).href
)
const expectedExports = [
  'buildGrafanaParams',
  'extractGrafanaPath',
  'handleGrafanaProxy',
  'isValidUrl',
  'joinPaths',
  'stripTrailingSlash',
]

function verifyRoot(api, label) {
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

function verifyComponent(api, label) {
  assert.deepEqual(Object.keys(api).sort(), ['GrafanaDashboard'], `${label} exports changed`)
  assert.equal(typeof api.GrafanaDashboard, 'function')
}

if (componentMode) {
  verifyComponent(commonJs, 'CommonJS component')
  verifyComponent(esModule, 'ESM component')
  console.log(`Built component smoke passed on Node ${process.versions.node}`)
} else {
  verifyRoot(commonJs, 'CommonJS root')
  verifyRoot(esModule, 'ESM root')
  console.log(`Built root smoke passed on Node ${process.versions.node}`)
}
```

Add these scripts to `package.json`:

```json
"smoke:dist": "node scripts/smoke-built-package.mjs",
"smoke:component": "node scripts/smoke-built-package.mjs --component"
```

Run:

```bash
set -euo pipefail
npm run build
npm run smoke:dist
npm run smoke:component
grep -Fq 'export { GrafanaDashboard };' dist/component.d.ts
```

Expected: both module formats expose exactly the documented root exports, both `./component` artifacts expose only `GrafanaDashboard`, the component declaration exports it, and pure utilities return identical values. The component mode runs only after a normal contributor install because React is an external peer; the Node 18 and 20 no-install consumer job intentionally continues to exercise only the dependency-free root entry.

- [ ] **Step 2: Add one reusable documented-example startup verifier**

Create executable `scripts/verify-example-startup.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
APP_DIR="${1:?usage: verify-example-startup.sh <examples/basic|examples/custom-session|examples/nextauth>}"
SCRATCH_DIR="${JCODE_SCRATCH_DIR:?JCODE_SCRATCH_DIR is required}"

case "$APP_DIR" in
  examples/basic)
    default_port=3201
    readiness_path=/
    expected_status=200
    ;;
  examples/custom-session)
    default_port=3202
    readiness_path=/api/auth/user
    expected_status=401
    ;;
  examples/nextauth)
    default_port=3203
    readiness_path=/api/auth/providers
    expected_status=200
    ;;
  *)
    echo "unsupported documented example: $APP_DIR" >&2
    exit 2
    ;;
esac

app_name="${APP_DIR##*/}"
app_port="${APP_PORT:-$default_port}"
app_base_url="http://127.0.0.1:${app_port}"
log_file="$SCRATCH_DIR/${app_name}-documented-workflow.log"
body_file="$SCRATCH_DIR/${app_name}-documented-workflow.body"

(
  cd "$REPO_ROOT"
  exec env \
    GRAFANA_INTERNAL_URL="${GRAFANA_INTERNAL_URL:-http://127.0.0.1:3001}" \
    NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-documented-workflow-smoke-secret}" \
    NEXTAUTH_URL="${NEXTAUTH_URL:-$app_base_url}" \
    npm run dev --prefix "$APP_DIR" -- --hostname 127.0.0.1 --port "$app_port"
) >"$log_file" 2>&1 &
app_pid=$!
cleanup() {
  kill "$app_pid" 2>/dev/null || true
  wait "$app_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

ready=0
for attempt in $(seq 1 90); do
  if ! kill -0 "$app_pid" 2>/dev/null; then
    cat "$log_file" >&2
    echo "$APP_DIR exited before becoming ready" >&2
    exit 1
  fi
  status="$(curl -s -o "$body_file" -w '%{http_code}' "$app_base_url$readiness_path" || true)"
  if [ "$status" = "$expected_status" ]; then
    ready=1
    break
  fi
  sleep 1
done
[ "$ready" -eq 1 ] || { cat "$log_file" >&2; echo "$APP_DIR did not become ready" >&2; exit 1; }

if [ "$APP_DIR" = "examples/nextauth" ]; then
  grep -Eq '"credentials"[[:space:]]*:' "$body_file"
fi

cleanup
trap - EXIT INT TERM
echo "$APP_DIR documented startup validation passed"
```

Run `chmod +x scripts/verify-example-startup.sh`. This script validates the public `npm run dev` path used by the three authentication example READMEs without requiring interactive edits or a running Grafana instance. The canonical Grafana stack remains a separate Task 4 boundary.

- [ ] **Step 3: Update the main CI contributor matrix**

In `.github/workflows/test.yml`:

1. Set the root `test` matrix to quoted values `['22.22.2', '24.15.0', '26.x']`.
2. Add `npm install --global npm@12.0.2` immediately after every modern `setup-node` step and before `npm ci`.
3. Keep type-check, lint, tests, build, artifact upload, bundle-size, and application build gates, and run `npm run smoke:component` after each contributor build.
4. Use Node `22.22.2` for the single bundle-size job.
5. Expand `examples-smoke` to the Cartesian matrix of all four `app-dir` values and all three contributor Node values.
6. After each Basic, Custom Session, or NextAuth build, set `JCODE_SCRATCH_DIR="$RUNNER_TEMP"` and run `scripts/verify-example-startup.sh "${{ matrix.app-dir }}"` so every documented application startup path is exercised on every contributor Node line.
7. Keep the sandbox Docker runtime smoke restricted to `matrix.app-dir == 'sandbox' && matrix.node-version == '22.22.2'` so application builds get full coverage without tripling the Docker runtime test.
8. Replace the npm 11 pin with npm `12.0.2`.

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

- [ ] **Step 4: Update security matrices**

In `.github/workflows/security.yml`:

- Give `dependency-audit` a Node matrix of `['22.22.2', '24.15.0', '26.x']`.
- Give `example-audit` both the same Node matrix and the four existing app directories.
- Pin npm `12.0.2` before each install.
- Keep root build before application install.
- Keep `npm audit --audit-level=high` for root and use the same high-severity threshold without `--omit=dev` for every application so future development dependencies remain covered.
- Leave CodeQL configuration unchanged.

Expected: all repository-owned dependency graphs are audited on every contributor runtime, while CodeQL remains a hard failure.

- [ ] **Step 5: Separate release validation from publication**

Refactor `.github/workflows/release.yml` into:

- `validate`: matrix `['22.22.2', '24.15.0', '26.x']`; checkout; setup Node; pin npm 12.0.2; `npm ci`; type-check; lint; tests; build; high audit; `npm pack --dry-run`.
- `publish`: `needs: validate`; Node `22.22.2`; npm 12.0.2; clean install; build; tag/package version equality check; `npm publish --provenance --access public`; GitHub release creation.

Keep `contents: write` and `id-token: write` only on `publish`. Do not add a version bump or tag creation step.

- [ ] **Step 6: Expand Dependabot while retaining only the TypeScript hold**

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

- [ ] **Step 7: Verify automation structure locally**

Run:

```bash
set -euo pipefail
npm run build
npm run smoke:dist
npm run smoke:component
bash -n scripts/verify-example-startup.sh
ruby -e 'require "yaml"; %w[.github/workflows/test.yml .github/workflows/security.yml .github/workflows/release.yml .github/dependabot.yml].each { |f| YAML.load_file(f); puts "valid YAML: #{f}" }'
ruby <<'RUBY'
require 'yaml'

updates = YAML.load_file('.github/dependabot.yml').fetch('updates')
expected_entries = [
  ['npm', '/'],
  ['npm', '/examples/basic'],
  ['npm', '/examples/custom-session'],
  ['npm', '/examples/nextauth'],
  ['npm', '/sandbox'],
  ['github-actions', '/'],
  ['docker', '/examples'],
]
actual_entries = updates.map { |entry| [entry['package-ecosystem'], entry['directory']] }
missing_entries = expected_entries - actual_entries
raise "missing Dependabot entries: #{missing_entries.inspect}" unless missing_entries.empty?

root_npm = updates.find { |entry| entry['package-ecosystem'] == 'npm' && entry['directory'] == '/' }
root_patterns = root_npm.fetch('groups').values.flat_map { |group| Array(group['patterns']) }
raise 'root lint grouping misses typescript-eslint' unless root_patterns.include?('typescript-eslint')
raise 'obsolete @typescript-eslint/* grouping remains' if root_patterns.include?('@typescript-eslint/*')

%w[/examples/basic /examples/custom-session /examples/nextauth /sandbox].each do |directory|
  entry = updates.find { |candidate| candidate['package-ecosystem'] == 'npm' && candidate['directory'] == directory }
  patterns = entry.fetch('groups').values.flat_map { |group| Array(group['patterns']) }
  required = %w[next react react-dom]
  required << 'next-auth' if directory == '/examples/nextauth'
  missing = required - patterns
  raise "#{directory} grouping misses #{missing.join(', ')}" unless missing.empty?
end

docker = updates.find { |entry| entry['package-ecosystem'] == 'docker' && entry['directory'] == '/examples' }
docker_patterns = docker.fetch('groups').values.flat_map { |group| Array(group['patterns']) }
raise 'Grafana Docker grouping missing' unless docker_patterns.include?('grafana/grafana')

ignored = updates.flat_map { |entry| Array(entry['ignore']) }
  .map { |rule| rule['dependency-name'] }
  .compact
raise "unexpected Dependabot ignores: #{ignored.inspect}" unless ignored == ['typescript']
RUBY
rg -n "22\.22\.2|24\.15\.0|26\.x|18\.18\.0|20\.9\.0|npm@12\.0\.2|verify-example-startup\.sh|RUNNER_TEMP" .github package.json
rg -n "jsdom|@testing-library/jest-dom" .github/dependabot.yml
```

Expected: the startup verifier has valid shell syntax and is referenced by hosted CI with `RUNNER_TEMP`; all YAML parses; every required npm, Actions, and Docker entry and group is present; TypeScript is the only ignored dependency; all required Node/npm values are present; the final grep finds jsdom and jest-dom only in grouping patterns, never in ignore blocks.

- [ ] **Step 8: Commit the automation task**

```bash
git add package.json scripts/smoke-built-package.mjs scripts/verify-example-startup.sh .github/workflows/test.yml .github/workflows/security.yml .github/workflows/release.yml .github/dependabot.yml
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
set -euo pipefail
for app in examples/basic examples/custom-session examples/nextauth sandbox; do
  rm -rf "$app/node_modules" "$app/.next"
  npx --yes npm@12.0.2 install --package-lock-only --prefix "$app"
done
```

Expected: lockfile version 3, local `file:` links retained, no root `../../node_modules/*` package keys, and no PostCSS or Sharp overrides recorded.

- [ ] **Step 4: Verify every application cleanly**

Run:

```bash
set -euo pipefail
npm run build
for app in examples/basic examples/custom-session examples/nextauth sandbox; do
  rm -rf "$app/node_modules" "$app/.next"
  npx --yes npm@12.0.2 ci --prefix "$app"
  GRAFANA_INTERNAL_URL=http://localhost:3001 \
  NEXTAUTH_SECRET=sandbox-ci-secret \
  NEXTAUTH_URL=http://localhost:3000 \
    npx --yes npm@12.0.2 run build --prefix "$app"
  npx --yes npm@12.0.2 audit --prefix "$app" --audit-level=high
  app_audit_name="${app//\//-}"
  app_audit="$JCODE_SCRATCH_DIR/$app_audit_name-audit.json"
  app_audit_status=0
  npx --yes npm@12.0.2 audit --prefix "$app" --json > "$app_audit" || app_audit_status=$?
  test "$app_audit_status" -eq 0
  node - "$app_audit" <<'NODE'
const assert = require('node:assert/strict')
const fs = require('node:fs')
const report = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const counts = report.metadata?.vulnerabilities ?? {}
for (const severity of ['info', 'low', 'moderate', 'high', 'critical', 'total']) {
  assert.equal(counts[severity] ?? 0, 0, `${severity} audit findings remain`)
}
assert.deepEqual(report.vulnerabilities ?? {}, {})
NODE
  npx --yes npm@12.0.2 outdated --prefix "$app" --long
done
```

Expected: all four production builds pass; each complete audit JSON reports zero findings at every severity; outdated output is empty; tracked `tsconfig.json` files are unchanged by the builds.

- [ ] **Step 5: Verify application manifest invariants**

Run:

```bash
set -euo pipefail
node <<'NODE'
const assert = require('node:assert/strict')
const fs = require('node:fs')

const expected = {
  'examples/basic': {
    next: '16.3.0',
    'next-grafana-auth': 'file:../..',
    react: '19.2.8',
    'react-dom': '19.2.8',
  },
  'examples/custom-session': {
    next: '16.3.0',
    'next-grafana-auth': 'file:../..',
    react: '19.2.8',
    'react-dom': '19.2.8',
  },
  'examples/nextauth': {
    next: '16.3.0',
    'next-auth': '^4.24.15',
    'next-grafana-auth': 'file:../..',
    react: '19.2.8',
    'react-dom': '19.2.8',
  },
  sandbox: {
    next: '16.3.0',
    'next-grafana-auth': 'file:../',
    react: '19.2.8',
    'react-dom': '19.2.8',
  },
}

for (const [dir, dependencies] of Object.entries(expected)) {
  const pkg = JSON.parse(fs.readFileSync(`${dir}/package.json`, 'utf8'))
  assert.deepEqual(pkg.dependencies, dependencies, `${dir}: direct dependencies changed`)
  assert.deepEqual(pkg.devDependencies ?? {}, {}, `${dir}: unexpected development dependencies`)
  assert.equal(pkg.overrides, undefined, `${dir}: overrides remain`)
}
NODE
```

Expected: exit 0.

- [ ] **Step 6: Commit the application upgrades**

```bash
git add \
  examples/basic/package.json examples/basic/package-lock.json examples/basic/tsconfig.json \
  examples/custom-session/package.json examples/custom-session/package-lock.json examples/custom-session/tsconfig.json \
  examples/nextauth/package.json examples/nextauth/package-lock.json examples/nextauth/tsconfig.json \
  sandbox/package.json sandbox/package-lock.json sandbox/tsconfig.json
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
APP_PID="${APP_PID:-}"
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
for attempt in $(seq 1 90); do
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

datasource_response="$(request_grafana "${GRAFANA_BASE_URL}/api/datasources/uid/testdata")"
grep -Eq '"uid"[[:space:]]*:[[:space:]]*"testdata"' <<< "$datasource_response"
dashboard_response="$(request_grafana "${GRAFANA_BASE_URL}/api/dashboards/uid/demo-dashboard")"
grep -Eq '"uid"[[:space:]]*:[[:space:]]*"demo-dashboard"' <<< "$dashboard_response"

query_payload='{"queries":[{"refId":"A","datasource":{"type":"grafana-testdata-datasource","uid":"testdata"},"scenarioId":"random_walk"}],"from":"now-15m","to":"now"}'
query_response="$(request_grafana \
  -H 'Content-Type: application/json' \
  -X POST \
  -d "$query_payload" \
  "${GRAFANA_BASE_URL}/api/ds/query")"
grep -q '"frames"' <<< "$query_response"

if [ -n "$APP_BASE_URL" ]; then
  app_ready=0
  for attempt in $(seq 1 90); do
    if [ -n "$APP_PID" ] && ! kill -0 "$APP_PID" 2>/dev/null; then
      echo "Application process exited before becoming healthy" >&2
      exit 1
    fi
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
  proxy_datasource_response="$(curl -fsS "${APP_BASE_URL}/api/grafana/api/datasources/uid/testdata")"
  grep -Eq '"uid"[[:space:]]*:[[:space:]]*"testdata"' <<< "$proxy_datasource_response"
  proxy_dashboard_response="$(curl -fsS "${APP_BASE_URL}/api/grafana/api/dashboards/uid/demo-dashboard")"
  grep -Eq '"uid"[[:space:]]*:[[:space:]]*"demo-dashboard"' <<< "$proxy_dashboard_response"
  proxy_query_response="$(curl -fsS \
    -H 'Content-Type: application/json' \
    -X POST \
    -d "$query_payload" \
    "${APP_BASE_URL}/api/grafana/api/ds/query")"
  grep -q '"frames"' <<< "$proxy_query_response"
  dashboard_page="$(curl -fsS "${APP_BASE_URL}/dashboard")"
  grep -q 'demo-dashboard' <<< "$dashboard_page"
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
      start_period: 180s
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

if [ "${QUICK_START_VERIFY_ONLY:-0}" = "1" ]; then
  echo "Building and starting the sandbox for clean-clone verification..."
  (cd "$SCRIPT_DIR" && GRAFANA_INTERNAL_URL=http://localhost:3001 npm run build)
  (
    cd "$SCRIPT_DIR"
    exec env GRAFANA_INTERNAL_URL=http://localhost:3001 npm run start -- --port 3000
  ) &
  app_pid=$!
  cleanup_app() {
    kill "$app_pid" 2>/dev/null || true
    wait "$app_pid" 2>/dev/null || true
  }
  trap cleanup_app EXIT INT TERM
  APP_PID="$app_pid" APP_BASE_URL=http://localhost:3000 "$REPO_ROOT/scripts/verify-grafana.sh"
  cleanup_app
  trap - EXIT INT TERM
  echo "Clean-clone sandbox validation passed"
  exit 0
fi

echo "Sandbox is ready at http://localhost:3000"
echo "Stop Grafana with: docker compose --project-directory \"$EXAMPLES_DIR\" -f \"$COMPOSE_FILE\" down"
cd "$SCRIPT_DIR"
exec npm run dev
```

Run `chmod +x sandbox/quick-start.sh`. Do not restore `docker-compose` v1 fallback, `lsof`, macOS-only port probing, or duplicated validation logic.

- [ ] **Step 5: Point CI runtime smoke to the canonical stack and verifier**

In the sandbox-only block of `.github/workflows/test.yml`, use the same public workflow documented for a clean checkout rather than duplicating its startup logic in YAML:

```bash
set -euo pipefail
cleanup() {
  docker compose \
    --project-directory examples \
    -f examples/docker-compose.yml \
    down -v >/dev/null 2>&1 || true
}
trap cleanup EXIT
docker compose -f examples/docker-compose.yml config --quiet
QUICK_START_VERIFY_ONLY=1 ./sandbox/quick-start.sh
```

This exact path installs and builds the root package, installs the sandbox, starts the canonical Grafana stack, builds and starts the production sandbox, checks Grafana directly and through the application proxy, and stops the application. The CI trap owns Grafana teardown even when verification fails.

Keep the runtime smoke restricted to the sandbox on Node 22.22.2.

- [ ] **Step 6: Verify Compose, shell, Grafana, and proxied rendering**

Run:

```bash
set -euo pipefail
bash -n sandbox/quick-start.sh
bash -n scripts/verify-grafana.sh
docker compose -f examples/docker-compose.yml config --quiet
docker compose -f examples/docker-compose.yml pull grafana
docker compose -f examples/docker-compose.yml down -v || true
QUICK_START_VERIFY_ONLY=1 ./sandbox/quick-start.sh
docker compose \
  --project-directory examples \
  -f examples/docker-compose.yml \
  down -v
```

For the end-user render check, start the stack and production sandbox, then use an agent-assisted headless browser against `http://localhost:3000/dashboard`:

```bash
set -euo pipefail
docker compose --project-directory examples -f examples/docker-compose.yml up -d
GRAFANA_BASE_URL=http://localhost:3001/api/grafana scripts/verify-grafana.sh
GRAFANA_INTERNAL_URL=http://localhost:3001 npm run build --prefix sandbox
npm run start --prefix sandbox -- --port 3000 > "$JCODE_SCRATCH_DIR/sandbox.log" 2>&1 &
APP_PID=$!
trap 'kill "$APP_PID" 2>/dev/null || true; docker compose --project-directory examples -f examples/docker-compose.yml down -v' EXIT
APP_BASE_URL=http://localhost:3000 scripts/verify-grafana.sh
```

Use the browser's real page and iframe interfaces, not copied markup or a mocked Grafana response. Wait for `iframe[src*="/api/grafana"]`, require its final frame URL to remain under the application origin and `/api/grafana`, enter the frame, and assert that `Server Metrics — Random Walk`, `CPU Usage`, `Memory Usage`, `Request Rate`, and `Response Latency (p95)` are visible. Fail on application page errors, capture a screenshot, and record Grafana Live WebSocket retries separately because the existing public contract is HTTP proxying only.

This panel check is a required agent-assisted local acceptance step, not a claim that hosted CI performs browser automation. Hosted CI locks the same runtime boundary through `scripts/verify-grafana.sh`; the local browser step separately proves end-user rendering without adding a permanent browser dependency to the package.

Expected: Grafana 13.1.3 passes health, datasource, dashboard, TestData query, application proxy, dashboard-route, and visible-panel checks.

- [ ] **Step 7: Commit the canonical Grafana task**

```bash
git add examples/docker-compose.yml sandbox/quick-start.sh scripts/verify-grafana.sh .github/workflows/test.yml
git add -u sandbox/docker-compose.yml sandbox/provisioning
git commit -m "chore(sandbox): consolidate Grafana test infrastructure"
```

Expected: Stage 2 is independently green and contains one canonical local Grafana stack.

- [ ] **Step 8: Prove the committed task from an actual clean clone**

Run only after Step 7 has committed every Task 4 file:

```bash
set -euo pipefail
test -n "${JCODE_SCRATCH_DIR:-}"
clean_clone_parent="$(mktemp -d "$JCODE_SCRATCH_DIR/next-grafana-auth-clean-clone.XXXXXX")"
clean_clone="$clean_clone_parent/repository"
git clone --local --no-hardlinks . "$clean_clone"
cleanup_clone_stack() {
  docker compose \
    --project-directory "$clean_clone/examples" \
    -f "$clean_clone/examples/docker-compose.yml" \
    down -v >/dev/null 2>&1 || true
}
trap cleanup_clone_stack EXIT
(
  cd "$clean_clone"
  QUICK_START_VERIFY_ONLY=1 ./sandbox/quick-start.sh
)
cleanup_clone_stack
trap - EXIT
```

Expected: a checkout containing only committed files completes the same root-build, sandbox-install, canonical-Grafana, production-application, and proxy-verification workflow that CI runs. If it fails, fix the committed task and rerun this exact check before continuing.

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
- Produces: a dependency-free `npm run docs:check` gate and removal of 35 tracked, unmaintained planning or QA artifacts.

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
set -euo pipefail
test "$(git ls-files 'docs/ai-setup/**' 'docs/dx/**' | wc -l | tr -d ' ')" = "35"
git rm -r docs/ai-setup docs/dx
```

Expected: 34 AI authoring/task/QA files and one deferred nonexistent-API guardrail are removed. Ignored local-only files under `docs/superpowers/` are not part of the repository and must not enter this commit.

- [ ] **Step 3: Prove no maintained document depends on deleted paths**

Run:

```bash
set -euo pipefail
if rg -n 'docs/(ai-setup|dx)|phase2-api-helper-guardrails|dependency-automation-cleanup|createGrafanaProxyHandler' \
  --glob '!docs/2026-08-08-repository-modernization-design.md' \
  --glob '!docs/2026-08-08-repository-modernization-plan.md' .; then
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
set -euo pipefail
npm ci
npm run build
docker compose -f examples/docker-compose.yml up -d
npm ci --prefix examples/basic
cp examples/basic/.env.example examples/basic/.env
npm run dev --prefix examples/basic
```

Use this exact clean-clone block in `examples/custom-session/README.md`:

```bash
set -euo pipefail
npm ci
npm run build
docker compose -f examples/docker-compose.yml up -d
npm ci --prefix examples/custom-session
cp examples/custom-session/.env.example examples/custom-session/.env
npm run dev --prefix examples/custom-session
```

Use this exact clean-clone block in `examples/nextauth/README.md`:

```bash
set -euo pipefail
npm ci
npm run build
docker compose -f examples/docker-compose.yml up -d
npm ci --prefix examples/nextauth
cp examples/nextauth/.env.example examples/nextauth/.env
NEXTAUTH_SECRET="$(openssl rand -base64 32)" npm run dev --prefix examples/nextauth
```

Explain that the final command supplies a generated development secret noninteractively and overrides the placeholder in `.env` for that process. For a stable local secret across restarts, replace the placeholder in `.env` once instead. Keep only example-specific auth flow, demo credentials, important files, production caveats, and teardown. Remove code statistics, stale log expectations, broad OAuth/database tutorials, repeated panel inventories, and claims that demo credential flows are production-ready.

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
set -euo pipefail
npm ci
npm run typecheck
npm run lint
npm run test:run
npm run build
npm run smoke:dist
npm run smoke:component
npm run docs:check
npm audit --audit-level=high
npm pack --dry-run
```

State the contributor Node range and npm 12.0.2 requirement, keep the consumer Node floor separate, and show root build before application installs.

Reduce `RELEASE_CHECKLIST.md` to release-only checkboxes: clean install, root suite, docs/link check, examples, Grafana smoke, high audit, dry-run pack, version/tag match, signed tag, workflow publication, npm package smoke, and post-release monitoring. Delete the generic Git/GPG tutorial, historical docs acceptance gates, and duplicate tag explanations.

- [ ] **Step 7: Validate retained docs and ownership boundaries**

Run:

```bash
set -euo pipefail
npm run docs:check
if rg -n 'sandbox/docker-compose|sandbox/provisioning|grafana-sandbox|GF_SERVER_ALLOW_EMBEDDING|npm@11\.13\.0|\^20\.19\.0|\^22\.13\.0' \
  README.md GETTING_STARTED.md TROUBLESHOOTING.md CONTRIBUTING.md RELEASE_CHECKLIST.md examples sandbox .agents; then
  echo "stale infrastructure or toolchain documentation remains" >&2
  exit 1
fi
if rg -n 'Code Statistics|Proxying to Grafana|docs acceptance gates|phase2|DOC-[0-9]+' \
  README.md GETTING_STARTED.md TROUBLESHOOTING.md CONTRIBUTING.md RELEASE_CHECKLIST.md examples sandbox; then
  echo "historical or duplicated documentation remains" >&2
  exit 1
fi
```

Expected: both stale-content searches return no maintained-document matches. Support-floor mentions of Grafana 11.6, Next 15, React 18, and Node 18.18 remain where they describe published compatibility, not example versions.

- [ ] **Step 8: Commit the retained documentation rewrite**

```bash
git add README.md GETTING_STARTED.md TROUBLESHOOTING.md CONTRIBUTING.md RELEASE_CHECKLIST.md examples/README.md examples/grafana/README.md examples/basic/README.md examples/nextauth/README.md examples/custom-session/README.md sandbox/README.md
git commit -m "docs: consolidate setup and maintenance guidance"
```

- [ ] **Step 9: Prove all three documented application workflows from an actual clean clone**

Run only after Step 8 has committed the retained documentation rewrite:

```bash
set -euo pipefail
test -n "${JCODE_SCRATCH_DIR:-}"
documented_clone_parent="$(mktemp -d "$JCODE_SCRATCH_DIR/next-grafana-auth-documented-workflows.XXXXXX")"
documented_clone="$documented_clone_parent/repository"
git clone --local --no-hardlinks . "$documented_clone"
cleanup_documented_stack() {
  docker compose \
    --project-directory "$documented_clone/examples" \
    -f "$documented_clone/examples/docker-compose.yml" \
    down -v >/dev/null 2>&1 || true
}
trap cleanup_documented_stack EXIT INT TERM
(
  cd "$documented_clone"
  npx --yes npm@12.0.2 ci
  npx --yes npm@12.0.2 run build
  for app in examples/basic examples/custom-session examples/nextauth; do
    npx --yes npm@12.0.2 ci --prefix "$app"
  done
  docker compose --project-directory examples -f examples/docker-compose.yml up -d
  GRAFANA_BASE_URL=http://127.0.0.1:3001 scripts/verify-grafana.sh
  for app in examples/basic examples/custom-session examples/nextauth; do
    JCODE_SCRATCH_DIR="$JCODE_SCRATCH_DIR" scripts/verify-example-startup.sh "$app"
  done
)
cleanup_documented_stack
trap - EXIT INT TERM
```

Expected: the committed README prerequisites, root build, canonical Grafana stack, three application installs, Basic homepage, unauthenticated Custom Session user route, and NextAuth credentials-provider route all work without manual editing or parent-worktree files.

Expected: Stage 3 is independently link-clean and every documented clean-clone path is executable through the same public commands used by hosted CI and the local startup verifier.

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
set -euo pipefail
npm run build
npm run smoke:dist
npm run smoke:component
npx vitest run tests/handler.test.ts tests/integration.test.ts tests/component.test.tsx tests/build-config.test.ts
cp dist/index.d.ts "$JCODE_SCRATCH_DIR/index.before.d.ts"
cp dist/component.d.ts "$JCODE_SCRATCH_DIR/component.before.d.ts"
```

Expected: focused tests pass with one skipped component placeholder; the smoke script records exactly six root runtime exports and one `./component` export.

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

Do not remove the component's error state or `onError` handler because those are documented public behavior. Do not replace the empty placeholder with a false jsdom test: React/jsdom does not reliably dispatch an iframe load failure, and real browsers do not guarantee an iframe `error` event for HTTP failures. Preserve this source and declaration surface unchanged; any later removal requires an explicit breaking-change decision and a browser contract that can observe it.

- [ ] **Step 5: Verify declarations, exports, behavior, and skipped-test removal**

Run:

```bash
set -euo pipefail
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run smoke:dist
npm run smoke:component
npm pack --dry-run
grep -Fq 'export { GrafanaDashboard };' dist/component.d.ts
rg -Fq --glob '*.d.ts' 'errorMessage?: string;' dist
grep -Fq 'onError={handleError}' src/component.tsx
node <<'NODE'
const assert = require('node:assert/strict')
const fs = require('node:fs')
const declaration = fs.readFileSync('dist/index.d.ts', 'utf8')
const exported = new Set()
for (const block of declaration.matchAll(/export\s*\{([^}]*)\}/gs)) {
  for (const rawSpecifier of block[1].split(',')) {
    const specifier = rawSpecifier.trim()
    if (!specifier) continue
    const parts = specifier.split(/\s+as\s+/)
    exported.add(parts[parts.length - 1].trim())
  }
}
const expected = [
  'GrafanaDashboardProps',
  'GrafanaProxyConfig',
  'GrafanaRetryContext',
  'GrafanaUrlParams',
  'buildGrafanaParams',
  'extractGrafanaPath',
  'handleGrafanaProxy',
  'isValidUrl',
  'joinPaths',
  'stripTrailingSlash',
].sort()
assert.deepEqual([...exported].sort(), expected)
NODE
if rg -n 'ProxyHandlerFunction|export function stripLeadingSlash|it\.skip|describe\.skip' src tests dist; then
  echo "removed internal or skipped surface remains"
  exit 1
fi
```

Inspect `dist/index.d.ts` and confirm `handleGrafanaProxy` still has:

```ts
(request: Request, config: GrafanaProxyConfig, pathParams?: string[]) => Promise<Response>
```

Expected: all tests pass with zero skips; root and `./component` runtime export names are unchanged; CJS, ESM, declarations, documented error-state surface, and package contents remain valid. The iframe-error event itself remains a documented compatibility hold rather than an overstated automated behavior claim.

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
- Create: `scripts/verify-custom-session.sh`
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
set -euo pipefail
npx vitest run tests/custom-session.test.ts
if rg -n 'Math\.random|setInterval|createdAt|userId|export async function (createSession|deleteSession|getUserBySessionId)|await (createSession|deleteSession|getUserBySessionId)' examples/custom-session/app; then
  echo "custom-session cleanup is incomplete"
  exit 1
fi
```

Expected: four tests pass and the static search returns no matches.

- [ ] **Step 5: Lock the real Custom Session HTTP routes**

Create executable `scripts/verify-custom-session.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
APP_DIR="$REPO_ROOT/examples/custom-session"
APP_PORT="${APP_PORT:-3100}"
APP_BASE_URL="${APP_BASE_URL:-http://127.0.0.1:${APP_PORT}}"
GRAFANA_INTERNAL_URL="${GRAFANA_INTERNAL_URL:-http://127.0.0.1:3001}"
SCRATCH_DIR="${JCODE_SCRATCH_DIR:?JCODE_SCRATCH_DIR is required}"
LOG_FILE="$SCRATCH_DIR/custom-session-runtime.log"
HEADERS_FILE="$SCRATCH_DIR/custom-session-signin.headers"
BODY_FILE="$SCRATCH_DIR/custom-session-response.json"
ROUTE_FILE="$APP_DIR/app/api/grafana/[...path]/route.ts"

node - "$ROUTE_FILE" <<'NODE'
const assert = require('node:assert/strict')
const fs = require('node:fs')
const source = fs.readFileSync(process.argv[2], 'utf8')
const exportBlock = source.match(/export\s*\{([^}]*)\}/s)
assert.ok(exportBlock, 'Custom Session Grafana route export block is missing')
const methods = exportBlock[1].split(',').map((specifier) => {
  const match = specifier.trim().match(/^handler\s+as\s+(GET|POST|PUT|PATCH|DELETE)$/)
  assert.ok(match, `unexpected Custom Session route export: ${specifier.trim()}`)
  return match[1]
})
assert.deepEqual(methods.sort(), ['DELETE', 'GET', 'PATCH', 'POST', 'PUT'])
NODE

(
  cd "$APP_DIR"
  exec env GRAFANA_INTERNAL_URL="$GRAFANA_INTERNAL_URL" npm run start -- --hostname 127.0.0.1 --port "$APP_PORT"
) >"$LOG_FILE" 2>&1 &
app_pid=$!
cleanup() {
  kill "$app_pid" 2>/dev/null || true
  wait "$app_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

ready=0
for attempt in $(seq 1 60); do
  if ! kill -0 "$app_pid" 2>/dev/null; then
    cat "$LOG_FILE" >&2
    echo "Custom Session application exited before becoming ready" >&2
    exit 1
  fi
  status="$(curl -s -o "$BODY_FILE" -w '%{http_code}' "$APP_BASE_URL/api/auth/user" || true)"
  if [ "$status" = "401" ]; then
    ready=1
    break
  fi
  sleep 1
done
[ "$ready" -eq 1 ] || { echo "Custom Session application did not become ready" >&2; exit 1; }

status="$(curl -sS -o "$BODY_FILE" -w '%{http_code}' -H 'Content-Type: application/json' -d '{}' "$APP_BASE_URL/api/auth/signin")"
[ "$status" = "400" ]
grep -Eq '"error"[[:space:]]*:[[:space:]]*"Email and password are required"' "$BODY_FILE"

status="$(curl -sS -o "$BODY_FILE" -w '%{http_code}' -H 'Content-Type: application/json' -d '{"email":"admin@example.com","password":"wrong"}' "$APP_BASE_URL/api/auth/signin")"
[ "$status" = "401" ]
grep -Eq '"error"[[:space:]]*:[[:space:]]*"Invalid credentials"' "$BODY_FILE"

status="$(curl -sS -o "$BODY_FILE" -w '%{http_code}' "$APP_BASE_URL/api/grafana/api/health")"
[ "$status" = "401" ]

status="$(curl -sS -D "$HEADERS_FILE" -o "$BODY_FILE" -w '%{http_code}' -H 'Content-Type: application/json' -d '{"email":"admin@example.com","password":"admin123"}' "$APP_BASE_URL/api/auth/signin")"
[ "$status" = "200" ]
grep -Eq '"success"[[:space:]]*:[[:space:]]*true' "$BODY_FILE"
cookie_line="$(grep -i '^set-cookie: sessionId=' "$HEADERS_FILE" | tr -d '\r' | head -n 1)"
for attribute in HttpOnly Secure SameSite=lax Max-Age=86400 Path=/; do
  case "$cookie_line" in
    *"$attribute"*) ;;
    *) echo "Session cookie is missing $attribute: $cookie_line" >&2; exit 1 ;;
  esac
done
session_id="$(printf '%s\n' "$cookie_line" | sed -E 's/^[^:]+: sessionId=([^;]+).*/\1/')"
[ -n "$session_id" ]

status="$(curl -sS -o "$BODY_FILE" -w '%{http_code}' -H "Cookie: sessionId=$session_id" "$APP_BASE_URL/api/auth/user")"
[ "$status" = "200" ]
grep -Eq '"email"[[:space:]]*:[[:space:]]*"admin@example.com"' "$BODY_FILE"
grep -Eq '"role"[[:space:]]*:[[:space:]]*"Admin"' "$BODY_FILE"

status="$(curl -sS -o "$BODY_FILE" -w '%{http_code}' -H "Cookie: sessionId=$session_id" "$APP_BASE_URL/api/grafana/api/health")"
[ "$status" = "200" ]
grep -Eq '"database"[[:space:]]*:[[:space:]]*"ok"' "$BODY_FILE"

status="$(curl -sS -o "$BODY_FILE" -w '%{http_code}' -X POST -H "Cookie: sessionId=$session_id" "$APP_BASE_URL/api/auth/signout")"
[ "$status" = "200" ]
grep -Eq '"success"[[:space:]]*:[[:space:]]*true' "$BODY_FILE"

status="$(curl -sS -o "$BODY_FILE" -w '%{http_code}' -H "Cookie: sessionId=$session_id" "$APP_BASE_URL/api/auth/user")"
[ "$status" = "401" ]
status="$(curl -sS -o "$BODY_FILE" -w '%{http_code}' -H "Cookie: sessionId=$session_id" "$APP_BASE_URL/api/grafana/api/health")"
[ "$status" = "401" ]

cleanup
trap - EXIT INT TERM
echo "Custom Session route validation passed"
```

Run `chmod +x scripts/verify-custom-session.sh`, then exercise the production application against the canonical Grafana stack:

```bash
set -euo pipefail
bash -n scripts/verify-custom-session.sh
npx --yes npm@12.0.2 run build --prefix examples/custom-session
cleanup_custom_session_stack() {
  docker compose --project-directory examples -f examples/docker-compose.yml down -v || true
}
trap cleanup_custom_session_stack EXIT INT TERM
docker compose --project-directory examples -f examples/docker-compose.yml up -d
GRAFANA_BASE_URL=http://127.0.0.1:3001/api/grafana scripts/verify-grafana.sh
JCODE_SCRATCH_DIR="$JCODE_SCRATCH_DIR" \
GRAFANA_INTERNAL_URL=http://127.0.0.1:3001 \
  scripts/verify-custom-session.sh
cleanup_custom_session_stack
trap - EXIT INT TERM
```

Expected: the Grafana route exports exactly `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`; missing and invalid credentials retain their `400` and `401` responses; unauthenticated Grafana access is denied; valid sign-in returns the expected secure cookie attributes; the user and authenticated Grafana routes succeed; sign-out revokes both routes. This is a real production-server and real-Grafana boundary, not a store-only proxy for route compatibility.

- [ ] **Step 6: Run the complete Stage 4 gate**

Run:

```bash
set -euo pipefail
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run smoke:dist
npm run smoke:component
npm run docs:check
npm audit --audit-level=high
npm pack --dry-run
bash -n sandbox/quick-start.sh
bash -n scripts/verify-example-startup.sh
bash -n scripts/verify-grafana.sh
bash -n scripts/verify-custom-session.sh
docker compose -f examples/docker-compose.yml config --quiet

for app in examples/basic examples/custom-session examples/nextauth sandbox; do
  rm -rf "$app/node_modules" "$app/.next"
  npx --yes npm@12.0.2 ci --prefix "$app"
  GRAFANA_INTERNAL_URL=http://localhost:3001 \
  NEXTAUTH_SECRET=sandbox-ci-secret \
  NEXTAUTH_URL=http://localhost:3000 \
    npx --yes npm@12.0.2 run build --prefix "$app"
  npx --yes npm@12.0.2 audit --prefix "$app" --audit-level=high
  app_audit_name="${app//\//-}"
  app_audit="$JCODE_SCRATCH_DIR/$app_audit_name-stage4-audit.json"
  app_audit_status=0
  npx --yes npm@12.0.2 audit --prefix "$app" --json > "$app_audit" || app_audit_status=$?
  test "$app_audit_status" -eq 0
  node - "$app_audit" <<'NODE'
const assert = require('node:assert/strict')
const fs = require('node:fs')
const report = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const counts = report.metadata?.vulnerabilities ?? {}
for (const severity of ['info', 'low', 'moderate', 'high', 'critical', 'total']) {
  assert.equal(counts[severity] ?? 0, 0, `${severity} audit findings remain`)
}
assert.deepEqual(report.vulnerabilities ?? {}, {})
NODE
done

for app in examples/basic examples/custom-session examples/nextauth; do
  JCODE_SCRATCH_DIR="$JCODE_SCRATCH_DIR" scripts/verify-example-startup.sh "$app"
done
```

Repeat the Task 4 Grafana and sandbox runtime smoke plus Step 5's Custom Session route validation. If Docker is unavailable, stop and report the acceptance check as blocked instead of claiming completion. Expected: every root, application, documentation, shell, Compose, audit, package, and runtime gate passes.

- [ ] **Step 7: Commit the custom-session cleanup**

```bash
git add tests/custom-session.test.ts scripts/verify-custom-session.sh examples/custom-session/app/lib/session.ts examples/custom-session/app/api/auth/signin/route.ts examples/custom-session/app/api/auth/signout/route.ts examples/custom-session/app/api/auth/user/route.ts 'examples/custom-session/app/api/grafana/[...path]/route.ts'
git commit -m "refactor(examples): simplify custom session demo"
```

Expected: Stage 4 is independently green and the demo no longer contains insecure randomness, unused session fields, async-only wrappers, or a global interval.

---

## Public Behavior Preservation Matrix

The final suite must preserve named behavior, not merely an aggregate test count. Use this matrix when reviewing `npm run test:run`, built-package smoke, and the real Grafana path:

| Protected public output or behavior | Concrete gate | Required observation |
| --- | --- | --- |
| Package version, `main`/`module`/`types`, files, consumer engine, peer ranges, export map, and zero runtime dependencies | Final manifest assertion, `npm pack --dry-run`, and exact generated declaration-export assertion | Manifest contract is byte-for-byte equivalent for every protected field, all ten root runtime/type exports remain present, and the tarball contains only intended package files |
| CommonJS and ESM root exports plus pure URL utilities | `scripts/smoke-built-package.mjs` on Node 18.18.0 and 20.9.0 | Both module formats expose exactly the six documented root exports and return the locked utility values |
| CommonJS, ESM, and declaration `./component` entry | `npm run smoke:component`, `dist/component.d.ts` assertions, and component regressions on the installed contributor graph | Both module formats expose only `GrafanaDashboard`; its declaration and documented error-state props remain present |
| Grafana URL, user email, role, and identity-header validation | Handler cases `should validate Grafana URL`, `should return 400 for invalid user email`, both header-injection cases, `should return 400 for invalid user role`, and `should ignore incoming identity headers and use trusted config headers` | Invalid or untrusted identity data is rejected or replaced by trusted configuration before the upstream request |
| Path normalization and traversal defense | Handler cases for root `pathPrefix`, empty path parameters, traversal segments, Grafana URL trailing slash, and `pathPrefix` trailing slash | Generated upstream paths remain canonical and traversal segments remain rejected |
| Methods, bodies, safe request headers, hop-by-hop blocking, timeout, fetch failure, and redirect isolation | Handler GET, POST, DELETE, safe/custom/forbidden/Connection header, HEAD, timeout, and fetch-error cases plus all three integration cases | Request semantics remain intact, forbidden headers do not cross the boundary, and trusted auth headers never follow a cross-origin redirect |
| Cookies and safe response metadata | Handler direct, fallback, and multiple `Set-Cookie` cases, safe response metadata case, and integration GET case | Grafana cookies and allowed metadata survive without collapsing multiple cookie values |
| Dashboard iframe URL, sandbox, loading, timeout, retry, title, and template variables | Every active case in `tests/component.test.tsx` | Component URL encoding, accessibility state, sandbox policy, retry callbacks, timing, title, and parameter serialization remain unchanged |
| Custom-session demo credentials, cookie, UUID sessions, TTL, deletion, lazy expiration, route method exports, and status codes | Four cases in `tests/custom-session.test.ts`, the production build, and `scripts/verify-custom-session.sh` against real Grafana | The route exports exactly `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`; missing and invalid credentials, sign-in, user lookup, authenticated proxying, sign-out, and revoked access retain their HTTP contract while the global timer, insecure ID generation, and unused fields are removed |
| Basic, Custom Session, and NextAuth documented startup workflows | `scripts/verify-example-startup.sh` in hosted CI, Task 6's post-commit clean clone, Stage 4, and final acceptance | The Basic homepage, Custom Session unauthenticated user route, and NextAuth credentials-provider route reach their expected status without manual edits or parent-worktree files |
| Next.js route, real Grafana auth-proxy, provisioned data, and visible dashboard | `scripts/verify-grafana.sh`, Task 4 clean-clone command, hosted sandbox smoke, and the agent-assisted Task 4 headless-browser panel assertions | Direct and proxied health, datasource, dashboard, query, application route, same-origin iframe navigation, and the five named panels succeed |

The iframe `error` event is intentionally not listed as a runtime-locked observation. React/jsdom cannot faithfully dispatch this browser boundary, and browsers do not guarantee that event for HTTP iframe failures. The implementation must preserve the `errorMessage`/retry declarations, source handler, and states unchanged; changing or deleting them remains a deferred public API decision rather than a fabricated passing test.

## Final Acceptance Checklist

Run after all eight tasks from a clean working tree on a supported contributor Node runtime with npm 12. The commands intentionally reinstall and rebuild every graph so stale local artifacts cannot satisfy the gate:

```bash
set -euo pipefail
test -n "${JCODE_SCRATCH_DIR:-}"
test -z "$(git status --porcelain)"
git diff --check
test "$(git ls-files 'package.json' '**/package.json' | wc -l | tr -d ' ')" -eq 5
test -z "$(git ls-files 'examples/prom-client/**')"
git check-ignore -q examples/prom-client/package.json
git check-ignore -q docs/superpowers/plans/2026-08-01-dependency-automation-cleanup.md
git check-ignore -q docs/superpowers/specs/2026-08-01-dependency-automation-cleanup-design.md
npx --yes npm@12.0.2 ci
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run smoke:dist
npm run smoke:component
npm run docs:check
npm audit --audit-level=high
npm pack --dry-run

root_audit="$JCODE_SCRATCH_DIR/root-audit-final.json"
root_audit_status=0
npx --yes npm@12.0.2 audit --json > "$root_audit" || root_audit_status=$?
if [ "$root_audit_status" -ne 0 ] && [ "$root_audit_status" -ne 1 ]; then
  echo "unexpected npm audit exit status: $root_audit_status" >&2
  exit 1
fi
node - "$root_audit" <<'NODE'
const assert = require('node:assert/strict')
const fs = require('node:fs')
const report = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const counts = report.metadata?.vulnerabilities ?? {}
assert.equal(counts.high ?? 0, 0)
assert.equal(counts.critical ?? 0, 0)
assert.equal(require('./node_modules/esbuild/package.json').version, '0.27.7')
const names = Object.keys(report.vulnerabilities ?? {})
if (names.length === 0) process.exit(0)
assert.deepEqual(names, ['esbuild'])
assert.equal(report.vulnerabilities.esbuild.severity, 'low')
const via = report.vulnerabilities.esbuild.via
const urls = (Array.isArray(via) ? via : [via])
  .filter((entry) => entry && typeof entry === 'object')
  .map((entry) => entry.url)
assert.ok(urls.includes('https://github.com/advisories/GHSA-g7r4-m6w7-qqqr'))
NODE

node <<'NODE'
const assert = require('node:assert/strict')
const pkg = require('./package.json')

assert.equal(pkg.version, '1.0.3')
assert.equal(pkg.main, './dist/index.js')
assert.equal(pkg.module, './dist/index.mjs')
assert.equal(pkg.types, './dist/index.d.ts')
assert.equal(pkg.engines.node, '>=18.18.0')
assert.equal(pkg.packageManager, 'npm@12.0.2')
assert.deepEqual(pkg.devEngines, {
  runtime: {
    name: 'node',
    version: '^22.22.2 || ^24.15.0 || >=26.0.0',
    onFail: 'error',
  },
})
assert.deepEqual(pkg.peerDependencies, {
  next: '>=15.0.0',
  react: '>=18.0.0',
  'react-dom': '>=18.0.0',
})
assert.deepEqual(pkg.files, ['dist', 'README.md', 'LICENSE'])
assert.deepEqual(pkg.exports, {
  '.': {
    types: './dist/index.d.ts',
    import: './dist/index.mjs',
    require: './dist/index.js',
  },
  './component': {
    types: './dist/component.d.ts',
    import: './dist/component.mjs',
    require: './dist/component.js',
  },
})
assert.equal(Object.keys(pkg.dependencies ?? {}).length, 0)
assert.deepEqual(pkg.devDependencies, {
  '@eslint/js': '^10.0.1',
  '@testing-library/jest-dom': '^7.0.0',
  '@testing-library/react': '^16.3.2',
  '@types/node': '^26.2.0',
  '@types/react': '^19.2.18',
  '@types/react-dom': '^19.2.4',
  eslint: '^10.8.1',
  jsdom: '^30.0.1',
  tsup: '^8.5.1',
  typescript: '5.9.3',
  'typescript-eslint': '^8.66.0',
  vitest: '^4.1.10',
})
NODE

node <<'NODE'
const assert = require('node:assert/strict')
const fs = require('node:fs')
const expected = {
  'examples/basic': {
    next: '16.3.0',
    'next-grafana-auth': 'file:../..',
    react: '19.2.8',
    'react-dom': '19.2.8',
  },
  'examples/custom-session': {
    next: '16.3.0',
    'next-grafana-auth': 'file:../..',
    react: '19.2.8',
    'react-dom': '19.2.8',
  },
  'examples/nextauth': {
    next: '16.3.0',
    'next-auth': '^4.24.15',
    'next-grafana-auth': 'file:../..',
    react: '19.2.8',
    'react-dom': '19.2.8',
  },
  sandbox: {
    next: '16.3.0',
    'next-grafana-auth': 'file:../',
    react: '19.2.8',
    'react-dom': '19.2.8',
  },
}
for (const [dir, dependencies] of Object.entries(expected)) {
  const pkg = JSON.parse(fs.readFileSync(`${dir}/package.json`, 'utf8'))
  assert.deepEqual(pkg.dependencies, dependencies, `${dir}: direct dependencies changed`)
  assert.deepEqual(pkg.devDependencies ?? {}, {}, `${dir}: unexpected development dependencies`)
  assert.equal(pkg.overrides, undefined, `${dir}: overrides remain`)
}
NODE

grep -Fq \
  'declare const handleGrafanaProxy: (request: Request, config: GrafanaProxyConfig, pathParams?: string[]) => Promise<Response>;' \
  dist/index.d.ts
grep -Fq 'export { GrafanaDashboard };' dist/component.d.ts
rg -Fq --glob '*.d.ts' 'errorMessage?: string;' dist
grep -Fq 'onError={handleError}' src/component.tsx
node <<'NODE'
const assert = require('node:assert/strict')
const fs = require('node:fs')
const declaration = fs.readFileSync('dist/index.d.ts', 'utf8')
const exported = new Set()
for (const block of declaration.matchAll(/export\s*\{([^}]*)\}/gs)) {
  for (const rawSpecifier of block[1].split(',')) {
    const specifier = rawSpecifier.trim()
    if (!specifier) continue
    const parts = specifier.split(/\s+as\s+/)
    exported.add(parts[parts.length - 1].trim())
  }
}
const expected = [
  'GrafanaDashboardProps',
  'GrafanaProxyConfig',
  'GrafanaRetryContext',
  'GrafanaUrlParams',
  'buildGrafanaParams',
  'extractGrafanaPath',
  'handleGrafanaProxy',
  'isValidUrl',
  'joinPaths',
  'stripTrailingSlash',
].sort()
assert.deepEqual([...exported].sort(), expected)
NODE

root_outdated="$JCODE_SCRATCH_DIR/root-outdated-final.json"
root_outdated_status=0
npx --yes npm@12.0.2 outdated --json > "$root_outdated" || root_outdated_status=$?
test "$root_outdated_status" -eq 1
node - "$root_outdated" <<'NODE'
const fs = require('node:fs')
const report = JSON.parse(fs.readFileSync(process.argv[2], 'utf8') || '{}')
const names = Object.keys(report)
if (names.length !== 1 || names[0] !== 'typescript') {
  throw new Error(`unexpected outdated root packages: ${names.join(', ') || 'none'}`)
}
if (report.typescript.current !== '5.9.3') {
  throw new Error(`unexpected TypeScript current version: ${report.typescript.current}`)
}
NODE

for app in examples/basic examples/custom-session examples/nextauth sandbox; do
  rm -rf "$app/node_modules" "$app/.next"
  npx --yes npm@12.0.2 ci --prefix "$app"
  GRAFANA_INTERNAL_URL=http://localhost:3001 \
  NEXTAUTH_SECRET=sandbox-ci-secret \
  NEXTAUTH_URL=http://localhost:3000 \
    npx --yes npm@12.0.2 run build --prefix "$app"
  npx --yes npm@12.0.2 audit --prefix "$app" --audit-level=high
  app_audit_name="${app//\//-}"
  app_audit="$JCODE_SCRATCH_DIR/$app_audit_name-final-audit.json"
  app_audit_status=0
  npx --yes npm@12.0.2 audit --prefix "$app" --json > "$app_audit" || app_audit_status=$?
  test "$app_audit_status" -eq 0
  node - "$app_audit" <<'NODE'
const assert = require('node:assert/strict')
const fs = require('node:fs')
const report = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const counts = report.metadata?.vulnerabilities ?? {}
for (const severity of ['info', 'low', 'moderate', 'high', 'critical', 'total']) {
  assert.equal(counts[severity] ?? 0, 0, `${severity} audit findings remain`)
}
assert.deepEqual(report.vulnerabilities ?? {}, {})
NODE
  npx --yes npm@12.0.2 outdated --prefix "$app" --long
done

bash -n scripts/verify-example-startup.sh
bash -n scripts/verify-grafana.sh
bash -n scripts/verify-custom-session.sh
for app in examples/basic examples/custom-session examples/nextauth; do
  JCODE_SCRATCH_DIR="$JCODE_SCRATCH_DIR" scripts/verify-example-startup.sh "$app"
done
docker compose -f examples/docker-compose.yml config --quiet
cleanup_final_custom_session() {
  docker compose --project-directory examples -f examples/docker-compose.yml down -v || true
}
trap cleanup_final_custom_session EXIT INT TERM
docker compose --project-directory examples -f examples/docker-compose.yml up -d
GRAFANA_BASE_URL=http://127.0.0.1:3001/api/grafana scripts/verify-grafana.sh
JCODE_SCRATCH_DIR="$JCODE_SCRATCH_DIR" \
GRAFANA_INTERNAL_URL=http://127.0.0.1:3001 \
  scripts/verify-custom-session.sh
cleanup_final_custom_session
trap - EXIT INT TERM

if rg -n '(it|test|describe)\.skip' tests; then
  echo "skipped tests remain"
  exit 1
fi
if rg -n 'ProxyHandlerFunction|export function stripLeadingSlash|Math\.random\(\)|setInterval\(' src tests examples/custom-session/app; then
  echo "planned source cleanup is incomplete"
  exit 1
fi
test -z "$(git status --porcelain)"
```

Then prove the final committed repository through the exact clean-clone entry point:

```bash
set -euo pipefail
clean_clone_parent="$(mktemp -d "$JCODE_SCRATCH_DIR/next-grafana-auth-final.XXXXXX")"
clean_clone="$clean_clone_parent/repository"
git clone --local --no-hardlinks . "$clean_clone"
cleanup_final_stack() {
  docker compose \
    --project-directory "$clean_clone/examples" \
    -f "$clean_clone/examples/docker-compose.yml" \
    down -v >/dev/null 2>&1 || true
}
trap cleanup_final_stack EXIT
(
  cd "$clean_clone"
  QUICK_START_VERIFY_ONLY=1 ./sandbox/quick-start.sh
)
cleanup_final_stack
trap - EXIT
```

Verify all of the following:

1. Exactly five package manifests are tracked; the ignored local-only Prom Client tree remains untouched. Root `npm outdated --json` reports only TypeScript, current `5.9.3`; every tracked application outdated command exits 0 with no dependency or development-dependency entries.
2. The root graph passes the high-severity audit, and every complete application audit JSON contains zero findings at every severity.
3. esbuild resolves to exactly `0.27.7`; the complete root audit JSON is empty or contains only low-severity esbuild `GHSA-g7r4-m6w7-qqqr`, the reviewed development-server path owned by tsup and not used by this repository.
4. Root tests report 58 passes and zero skips, including every behavior named in the preservation matrix.
5. CommonJS and ESM root smoke passes locally and in hosted CI on Node 18.18.0 and 20.9.0 without installing development dependencies; the `./component` CJS, ESM, and declaration smoke passes on every installed contributor graph.
6. All four applications use Next.js 16.3.0 and React 19.2.8, have no PostCSS or Sharp overrides, and pass clean npm 12 installs and production builds.
7. NextAuth remains on the latest stable 4.x line and passes its Next.js 16 and React 19 build.
8. Grafana 13.1.3 passes direct and proxied health, datasource, dashboard, query, and dashboard-route checks; the required agent-assisted local browser check reaches the same-origin iframe and sees the five named panels.
9. `examples/docker-compose.yml` and `examples/provisioning/` are the only local Grafana infrastructure owners.
10. Exactly 35 tracked historical docs are gone; all retained local links and anchors resolve; the two active modernization execution artifacts have no maintained references and are ready for the final retirement step below.
11. `ProxyHandlerFunction`, exported `stripLeadingSlash`, the empty skipped test, the global session timer, `Math.random()` session IDs, and unused session fields are gone.
12. `package.json` version, `main`, `module`, `types`, consumer engine, peer ranges, package files, package export map, runtime dependency count, generated proxy declaration, exact ten-name root runtime/type declaration export set, `./component` export, and documented component error-state surface are unchanged.
13. No generated `.next`, `dist`, `node_modules`, scratch files, manual lock edits, or unrelated changes are staged.
14. Hosted CI matrices pass on Node 22.22.2, 24.15.0, and 26.x; consumer smoke passes on Node 18.18.0 and 20.9.0.
15. Task 6's local clean clone and hosted CI execute `scripts/verify-example-startup.sh` for Basic, Custom Session, and NextAuth; the final local clean clone and hosted sandbox smoke both pass `QUICK_START_VERIFY_ONLY=1 ./sandbox/quick-start.sh` without relying on untracked or parent-worktree files.
16. The production Custom Session Grafana route exports exactly `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`, and preserves missing/invalid credential responses, secure cookie attributes, authenticated user and Grafana access, sign-out, and post-sign-out denial against the real canonical Grafana stack.

## Requirement Traceability

| Design requirement | Implemented by | Exact verification |
| --- | --- | --- |
| Every tracked package, including development dependencies, with only the TypeScript hold | Tasks 1 and 3 plus final acceptance | Exact five-manifest tracked inventory and ignored-local assertion, exact root and per-application dependency/development-dependency maps, npm 12 clean installs, strict root/application outdated gates, exact zero-finding application audits, and the exact esbuild `0.27.7`/optional-low assertion |
| Latest compatible dependencies and development dependencies in all four applications | Task 3 | Per-application npm 12 clean install, production build, complete zero-finding audit JSON, strict `npm outdated` exit, and manifest invariant assertion |
| Contributor Node and npm policy plus old consumer-runtime compatibility | Task 2 | Manifest metadata assertion, hosted contributor matrix, no-install root CommonJS/ESM smoke on Node 18.18.0 and 20.9.0, and installed-graph `./component` CJS/ESM/declaration smoke |
| Dependabot root, application, Actions, and Docker coverage with only the TypeScript hold | Task 2 | YAML parse plus structural assertions for every ecosystem, directory, framework group, Grafana image group, and ignore rule |
| Next.js 16, React 19, latest stable NextAuth 4, and override removal | Task 3 | Exact manifest assertion and all four clean production builds |
| Grafana 13 and one canonical stack | Task 4 | Compose config, fresh-volume health window, direct and proxied health/datasource/dashboard/query verifier, duplicate-owner search, and agent-assisted visible-panel browser check |
| Executable clean-clone sandbox workflow | Task 4 | Post-commit local clone and hosted CI both invoke the exact `QUICK_START_VERIFY_ONLY=1 ./sandbox/quick-start.sh` public path |
| Delete exactly 35 tracked historical docs and preserve valid retained links | Task 5 | Exact tracked-file count before deletion, maintained-reference search, and `npm run docs:check` over the retained set |
| One maintained documentation owner per setup fact and executable documented commands | Tasks 2 and 6 | Retained-document link check, two stale-content searches, noninteractive README command blocks, hosted startup smoke, and a post-commit clean clone that starts the canonical Grafana stack plus Basic, Custom Session, and NextAuth public routes |
| Internal root source and skipped-placeholder removal without public API loss | Task 7 | Removal search, zero-skip focused/full tests, exact ten-name generated declaration export-set assertion, exact built-export smoke, app builds, and package dry run |
| Custom-session UUID, field, timer, and async cleanup without route changes | Task 8 | Four focused store regressions, removal search, full root suite, production build, exact five-method route-export assertion, and real HTTP sign-in/user/proxy/sign-out acceptance against canonical Grafana |
| Public API, proxy security, component, cookie, redirect, timeout, and response preservation | Tasks 1, 2, 4, 7, and 8 plus final acceptance | Exact manifest assertions including `main`/`module`/`types`, every named row in the Public Behavior Preservation Matrix, exact ten-name root declaration export set, root and component CJS/ESM smoke, handler/integration/component suites, real proxy and Custom Session verifiers, and agent-assisted end-user iframe render; the unobservable iframe-error event is explicitly preserved as a source/declaration compatibility hold rather than claimed as runtime-verified |
| Removal of temporary modernization execution documentation | Final retirement | No maintained references to either artifact, retained-link check after `git rm`, clean diff, and dedicated retirement commit |

## Retire Modernization Execution Artifacts

Run only after every local checklist item, clean-clone check, headless-browser assertion, hosted CI job, and independent review has passed. Git history remains the decision record, so the version-pinned design and plan should not remain as maintained product documentation:

```bash
set -euo pipefail
if rg -n '2026-08-08-repository-modernization-(design|plan)\.md' \
  --glob '!docs/2026-08-08-repository-modernization-design.md' \
  --glob '!docs/2026-08-08-repository-modernization-plan.md' .; then
  echo "maintained references to modernization execution artifacts remain"
  exit 1
fi
git rm \
  docs/2026-08-08-repository-modernization-design.md \
  docs/2026-08-08-repository-modernization-plan.md
npm run docs:check
git diff --check
git commit -m "docs: retire modernization execution artifacts"
```

Expected: the maintained tree contains only durable product, contributor, example, policy, and installable-skill documentation. The implementation decisions remain available in Git history.
