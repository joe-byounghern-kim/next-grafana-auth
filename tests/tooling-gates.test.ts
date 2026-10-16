import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import { ESLint } from 'eslint'
import { parse } from 'yaml'
import { afterEach, describe, expect, it } from 'vitest'
import vitestConfig from '../vitest.config.mts'

const root = fileURLToPath(new URL('..', import.meta.url))
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'))
const workflow = parse(readFileSync(join(root, '.github/workflows/test.yml'), 'utf8'))
const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('tooling quality gates', () => {
  it('lints only src, tests and scripts through quoted recursive globs', async () => {
    const command = manifest.scripts.lint as string
    const globs = [...command.matchAll(/"([^"]+)"/g)].map((match) => match[1])
    expect(command.startsWith('eslint ')).toBe(true)
    expect(globs.map((glob) => glob.split('/')[0]).sort()).toEqual(['scripts', 'src', 'tests'])
    expect(command).toBe(`eslint ${globs.map((glob) => `"${glob}"`).join(' ')}`)

    const results = await new ESLint({ cwd: root }).lintFiles(globs)
    const files = results.map((result) => result.filePath)
    for (const file of ['src/index.ts', 'src/component.tsx', 'tests/handler.test.ts', 'tests/component.test.tsx', 'scripts/smoke-built-package.mjs']) {
      expect(files).toContain(resolve(root, file))
    }
    expect(files.every((file) => /\/(src|tests|scripts)\//.test(file))).toBe(true)
  })

  it('keeps JS undefined-variable checks with Node globals and TS type-import checks', async () => {
    const eslint = new ESLint({ cwd: root })
    const [valid] = await eslint.lintText('console.log(process.version, Buffer.from("ok"))', {
      filePath: 'scripts/lint-probe.mjs',
    })
    expect(valid.messages).toEqual([])
    const [invalid] = await eslint.lintText('missingToolingGlobal()', { filePath: 'scripts/lint-probe.mjs' })
    expect(invalid.messages.map((message) => message.ruleId)).toContain('no-undef')
    const [typescript] = await eslint.lintText('import { Stats } from "node:fs"\nexport type FileStats = Stats', {
      filePath: 'tests/lint-probe.ts',
    })
    expect(typescript.messages.map((message) => message.ruleId)).toContain('@typescript-eslint/consistent-type-imports')
  })

  it('runs matching V8 coverage in CI with explicit >=80% per-file core thresholds', () => {
    expect(manifest.scripts['test:coverage']).toBe('vitest run --coverage')
    expect(manifest.devDependencies['@vitest/coverage-v8']).toBe(lock.packages['node_modules/vitest'].version)
    const coverage = vitestConfig.test?.coverage
    expect(coverage?.provider).toBe('v8')
    expect(coverage?.include).toEqual(['src/index.ts', 'src/utils.ts'])
    const thresholds = coverage?.thresholds
    expect(thresholds?.perFile).toBe(true)
    for (const file of ['src/index.ts', 'src/utils.ts'] as const) {
      for (const metric of ['lines', 'statements', 'functions', 'branches'] as const) {
        expect(thresholds?.[file]?.[metric]).toBeGreaterThanOrEqual(80)
      }
    }
    expect(workflow.jobs.test.steps.some((step: { run?: string }) => step.run === 'npm run test:coverage')).toBe(true)
  })

  it('checks bundle budgets through the same command locally and in CI', () => {
    expect(manifest.scripts['size:check']).toBe('node scripts/check-bundle-size.mjs')
    expect(workflow.jobs['check-size'].steps.some((step: { run?: string }) => step.run === 'npm run size:check')).toBe(true)
  })

  function checkBundles(oversized?: 'index' | 'component', missing?: 'index' | 'component') {
    const directory = mkdtempSync(join(process.env.JCODE_SCRATCH_DIR || tmpdir(), 'grafana-budgets-'))
    temporaryDirectories.push(directory)
    mkdirSync(join(directory, 'dist'))
    for (const entry of ['index', 'component'] as const) {
      if (entry !== missing) {
        writeFileSync(join(directory, 'dist', `${entry}.mjs`), entry === oversized ? randomBytes(20000) : 'export {}')
      }
    }
    return spawnSync(process.execPath, [join(root, 'scripts/check-bundle-size.mjs')], {
      cwd: directory,
      encoding: 'utf8',
    })
  }

  it('accepts two bundles under the 15360-byte gzip budget', () => {
    const result = checkBundles()
    expect(result.status, result.stderr).toBe(0)
    expect(result.stdout).toContain('dist/index.mjs')
    expect(result.stdout).toContain('dist/component.mjs')
    expect(result.stdout).toContain('15360')
  })

  it.each(['index', 'component'] as const)('rejects an oversized %s bundle independently', (entry) => {
    const result = checkBundles(entry)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain(`dist/${entry}.mjs exceeds`)
  })

  it.each(['index', 'component'] as const)('rejects a missing %s build artifact', (entry) => {
    const result = checkBundles(undefined, entry)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain(`dist/${entry}.mjs`)
    expect(result.stderr).toContain('ENOENT')
  })
})
