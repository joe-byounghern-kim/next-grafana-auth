import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs'
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
import ts from 'typescript'
import { parse } from 'yaml'
import type { GrafanaProxyConfig } from '../src/types'

const root = resolve(import.meta.dirname, '..')
const skillRoot = resolve(root, '.agents/skills/next-grafana-auth')
const read = (path: string) => readFileSync(path, 'utf8')
const skillFiles = readdirSync(skillRoot).filter((file) => file.endsWith('.md'))
const skill = read(resolve(skillRoot, 'SKILL.md'))
const allMarkdown = skillFiles.map((file) => read(resolve(skillRoot, file))).join('\n')

function linkTargets(markdown: string): string[] {
  const prose = markdown.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm, '')
  return [...prose.matchAll(/!?\[[^\]]*\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\s*\)|^\s*\[[^\]]+\]:\s*(<[^>]+>|\S+)/gm)]
    .map((match) => (match[1] ?? match[2]).replace(/^<|>$/g, ''))
}

function localLink(source: string, target: string): string | null {
  if (/^[a-z][a-z\d+.-]*:/i.test(target) || target.startsWith('//')) return null
  const path = decodeURIComponent(target.split(/[?#]/)[0])
  const resolved = path ? resolve(dirname(source), path) : source
  const within = relative(skillRoot, resolved)
  if (isAbsolute(within) || within === '..' || within.startsWith('../')) {
    throw new Error(`Link escapes installed skill: ${target}`)
  }
  if (!existsSync(resolved)) throw new Error(`Missing skill link: ${target}`)
  const realWithin = relative(realpathSync(skillRoot), realpathSync(resolved))
  if (isAbsolute(realWithin) || realWithin === '..' || realWithin.startsWith('../')) {
    throw new Error(`Symlink escapes installed skill: ${target}`)
  }
  return resolved
}

function sourceFile(path: string): ts.SourceFile {
  return ts.createSourceFile(path, read(resolve(root, path)), ts.ScriptTarget.Latest, true)
}

const types = sourceFile('src/types.ts')
function properties(interfaceName: string): string[] {
  const declaration = types.statements.find(
    (statement): statement is ts.InterfaceDeclaration =>
      ts.isInterfaceDeclaration(statement) && statement.name.text === interfaceName
  )
  expect(declaration, interfaceName).toBeDefined()
  return declaration!.members.map((member) => member.name!.getText(types))
}

function constant(path: string, name: string): string | number {
  const source = sourceFile(path)
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(source) !== name || !declaration.initializer) continue
      if (ts.isStringLiteral(declaration.initializer)) return declaration.initializer.text
      if (ts.isNumericLiteral(declaration.initializer)) return Number(declaration.initializer.text)
    }
  }
  throw new Error(`Missing source constant: ${name}`)
}

function templateDiagnostics(built: boolean): string[] {
  const template = read(resolve(skillRoot, 'templates.md'))
  const snippets = [...template.matchAll(/^```(ts|tsx)\n([\s\S]*?)^```/gm)]
  expect(snippets).toHaveLength(2)
  const files = new Map(snippets.map((match, index) => [
    resolve(root, `tests/__skill_template_${index}.${match[1] === 'tsx' ? 'tsx' : 'ts'}`),
    match[2],
  ]))
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    esModuleInterop: true,
    types: ['node', 'react'],
    ...(built ? {} : { baseUrl: root, paths: {
      'next-grafana-auth': ['./src/index.ts'],
      'next-grafana-auth/component': ['./src/component.tsx'],
    } }),
  }
  const host = ts.createCompilerHost(options)
  const originalRead = host.readFile.bind(host)
  const originalExists = host.fileExists.bind(host)
  host.readFile = (path) => files.get(path) ?? originalRead(path)
  host.fileExists = (path) => files.has(path) || originalExists(path)
  const program = ts.createProgram([...files.keys()], options, host)
  if (built) {
    for (const entry of ['index', 'component']) {
      expect(program.getSourceFile(resolve(root, `dist/${entry}.d.ts`)), `built ${entry} declarations`).toBeDefined()
    }
  }
  return ts.getPreEmitDiagnostics(program).map((diagnostic) =>
    ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
  )
}

function routeHarness(identity?: { email: string; role?: unknown }, env = {}) {
  const template = read(resolve(skillRoot, 'templates.md'))
  const route = template.match(/^```ts\n([\s\S]*?)^```/m)![1]
  const calls: { request: Request; config: GrafanaProxyConfig; path: string[] }[] = []
  type Handler = (request: Request, context: { params: Promise<{ path: string[] }> }) => Promise<Response>
  const output: { GET?: Handler; POST?: Handler } = {}
  const compiled = ts.transpileModule(route, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  // Substitute only the application-owned session boundary, not the route logic.
  const sessionOverride = identity === undefined ? '' : '\ngetServerIdentity = async () => testIdentity'
  runInNewContext(compiled + sessionOverride, {
    exports: output,
    testIdentity: identity,
    require: (specifier: string) => {
      expect(specifier).toBe('next-grafana-auth')
      return { handleGrafanaProxy: async (request: Request, config: GrafanaProxyConfig, path: string[]) => {
        calls.push({ request, config, path })
        return Response.json({ proxied: true })
      } }
    },
    Response,
    process: { env },
  })
  return { output, calls }
}

function iniSettings(block: string): Record<string, string> {
  let section = ''
  const settings: Record<string, string> = {}
  for (const rawLine of block.split('\n')) {
    const line = rawLine.trim()
    const heading = line.match(/^\[([^\]]+)\]$/)
    if (heading) section = heading[1]
    else if (line && !line.startsWith('#') && !line.startsWith(';')) {
      const equals = line.indexOf('=')
      expect(equals).toBeGreaterThan(0)
      settings[`${section}.${line.slice(0, equals).trim()}`] = line.slice(equals + 1).trim()
    }
  }
  return settings
}

describe('installable next-grafana-auth skill', () => {
  it('parses YAML frontmatter and enforces skill discovery limits', () => {
    const frontmatter = skill.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
    expect(frontmatter).not.toBeNull()
    const metadata: unknown = parse(frontmatter![1])
    expect(metadata).toEqual(expect.objectContaining({
      name: basename(skillRoot), description: expect.any(String),
    }))
    const { name, description } = metadata as { name: string; description: string }
    expect(name).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    expect(name.length).toBeLessThanOrEqual(64)
    expect(description.length).toBeGreaterThan(0)
    expect(description.length).toBeLessThanOrEqual(1024)
  })

  it('keeps every relative Markdown link inside the installed skill', () => {
    for (const file of skillFiles) {
      const source = resolve(skillRoot, file)
      for (const target of linkTargets(read(source))) localLink(source, target)
    }
  })

  it('rejects traversal, encoded traversal and missing links', () => {
    const source = resolve(skillRoot, 'SKILL.md')
    for (const target of ['../outside.md', '%2e%2e/outside.md', '/outside.md', 'missing.md']) {
      expect(() => localLink(source, target)).toThrow()
    }
    expect(linkTargets('[inline](workflow.md)\n[reference]: branches.md\n')).toEqual(['workflow.md', 'branches.md'])
  })

  it('names real source exports and config/prop properties', () => {
    const program = ts.createProgram([resolve(root, 'src/index.ts'), resolve(root, 'src/component.tsx')], {
      target: ts.ScriptTarget.ES2022, moduleResolution: ts.ModuleResolutionKind.Bundler,
      module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, skipLibCheck: true,
    })
    const checker = program.getTypeChecker()
    const moduleExports = new Map<string, string[]>()
    for (const [file, specifier, required] of [
      ['src/index.ts', 'next-grafana-auth', 'handleGrafanaProxy'],
      ['src/component.tsx', 'next-grafana-auth/component', 'GrafanaDashboard'],
    ]) {
      const module = checker.getSymbolAtLocation(program.getSourceFile(resolve(root, file))!)!
      const exports = checker.getExportsOfModule(module).map((symbol) => symbol.name)
      expect(exports).toContain(required)
      moduleExports.set(specifier, exports)
    }
    for (const [, language, code] of allMarkdown.matchAll(/^```(ts|tsx)\n([\s\S]*?)^```/gm)) {
      const snippet = ts.createSourceFile(`snippet.${language}`, code, ts.ScriptTarget.Latest, true)
      for (const statement of snippet.statements) {
        if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue
        const specifier = statement.moduleSpecifier.text
        if (!specifier.startsWith('next-grafana-auth')) continue
        expect(moduleExports.has(specifier), specifier).toBe(true)
        const bindings = statement.importClause?.namedBindings
        if (bindings && ts.isNamedImports(bindings)) {
          for (const element of bindings.elements) {
            expect(moduleExports.get(specifier), specifier).toContain((element.propertyName ?? element.name).text)
          }
        }
      }
    }
    // Each documented API table row identifies its owning source interface.
    const rows = [...allMarkdown.matchAll(/^\| `(GrafanaProxyConfig|GrafanaDashboardProps|GrafanaUrlParams)\.([A-Za-z]+)` \|/gm)]
    expect(rows.length).toBeGreaterThan(0)
    for (const [, owner, name] of rows) expect(properties(owner), `${owner}.${name}`).toContain(name)
    // Require coverage of every source API property actually mentioned in the skill.
    for (const owner of ['GrafanaProxyConfig', 'GrafanaDashboardProps', 'GrafanaUrlParams']) {
      for (const name of properties(owner)) {
        if (allMarkdown.includes(`\`${name}\``)) {
          expect(rows.some(([, rowOwner, rowName]) => rowOwner === owner && rowName === name), name).toBe(true)
        }
      }
    }
  })

  it.each([
    ['src/index.ts', 'DEFAULT_PATH_PREFIX', 'pathPrefix'],
    ['src/index.ts', 'DEFAULT_REQUEST_TIMEOUT_MS', 'requestTimeoutMs'],
    ['src/component.tsx', 'DEFAULT_IFRAME_SANDBOX', 'sandbox'],
  ])('quotes the source default for %s %s', (path, name, option) => {
    const value = constant(path, name)
    const quoted = typeof value === 'string' ? `'${value}'` : String(value)
    expect(allMarkdown).toContain(`Default ${option}: \`${quoted}\``)
  })

  it('typechecks the copyable route and client templates against source', () => {
    expect(templateDiagnostics(false)).toEqual([])
  }, 20000)

  it.each(['GET', 'POST'] as const)('rejects an absent session before proxying %s', async (method) => {
    const { output, calls } = routeHarness()
    const response = await output[method]!(new Request('http://localhost/api/grafana/api/health', { method }), {
      params: Promise.resolve({ path: ['api', 'health'] }),
    })
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
    expect(calls).toHaveLength(0)
    expect(Object.keys(output).sort()).toEqual(['GET', 'POST'])
  })

  it.each(['GET', 'POST'] as const)('uses trusted identity, strict roles and awaited paths for %s', async (method) => {
    for (const role of ['Admin', 'Editor', 'Viewer', 'Owner', 'constructor', '__proto__', undefined]) {
      const { output, calls } = routeHarness({ email: 'session@example.com', role }, {
        GRAFANA_INTERNAL_URL: 'http://grafana:3000',
      })
      const request = new Request('http://localhost/api/grafana/api/health', {
        method,
        headers: { 'X-WEBAUTH-USER': 'spoof@example.com', 'X-WEBAUTH-ROLE': 'Admin' },
      })
      const response = await output[method]!(request, {
        params: Promise.resolve({ path: ['api', 'health'] }),
      })
      expect(response.status).toBe(200)
      expect(calls).toHaveLength(1)
      expect(calls[0].request).toBe(request)
      expect(calls[0].path).toEqual(['api', 'health'])
      expect(calls[0].config).toEqual({
        grafanaUrl: 'http://grafana:3000',
        userEmail: 'session@example.com',
        userRole: role === 'Admin' || role === 'Editor' ? role : 'Viewer',
        pathPrefix: constant('src/index.ts', 'DEFAULT_PATH_PREFIX'),
      })
    }
  })

  it('returns 500 for missing internal URL after resolving a valid session', async () => {
    const { output, calls } = routeHarness({ email: 'session@example.com', role: 'Viewer' })
    const response = await output.GET!(new Request('http://localhost/api/grafana/api/health'), {
      params: Promise.resolve({ path: ['api', 'health'] }),
    })
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Missing GRAFANA_INTERNAL_URL' })
    expect(calls).toHaveLength(0)
  })

  it('copies Grafana auth-proxy keys and role mapping from canonical documentation', () => {
    const template = read(resolve(skillRoot, 'templates.md'))
    const settings = iniSettings(template.match(/^```ini\n([\s\S]*?)^```/m)![1])
    const gettingStarted = read(resolve(root, 'GETTING_STARTED.md'))
    const documented = iniSettings(gettingStarted.match(/^```ini\n([\s\S]*?)^```/m)![1])
    for (const [key, value] of Object.entries(documented)) expect(settings[key], key).toBe(value)
    const compose = parse(read(resolve(root, 'examples/docker-compose.yml'))) as {
      services: { grafana: { environment: string[] } }
    }
    const environment = Object.fromEntries(compose.services.grafana.environment.map((entry) => {
      const equals = entry.indexOf('=')
      return [entry.slice(0, equals), entry.slice(equals + 1)]
    }))
    for (const [iniKey, envKey] of [
      ['server.serve_from_sub_path', 'GF_SERVER_SERVE_FROM_SUB_PATH'],
      ['security.allow_embedding', 'GF_SECURITY_ALLOW_EMBEDDING'],
      ['auth.proxy.enabled', 'GF_AUTH_PROXY_ENABLED'],
      ['auth.proxy.header_name', 'GF_AUTH_PROXY_HEADER_NAME'],
      ['auth.proxy.header_property', 'GF_AUTH_PROXY_HEADER_PROPERTY'],
      ['auth.proxy.headers', 'GF_AUTH_PROXY_HEADERS'],
      ['auth.proxy.auto_sign_up', 'GF_AUTH_PROXY_AUTO_SIGN_UP'],
      ['auth.proxy.enable_login_token', 'GF_AUTH_PROXY_ENABLE_LOGIN_TOKEN'],
    ]) expect(settings[iniKey], iniKey).toBe(environment[envKey])
    expect(settings['auth.proxy.whitelist']).toBe('<trusted-nextjs-proxy-egress-ip-or-cidr>')
    expect(new URL(settings['server.root_url']).pathname).toBe(`${constant('src/index.ts', 'DEFAULT_PATH_PREFIX')}/`)
  })

  it.skipIf(!existsSync(resolve(root, 'dist/index.d.ts')))('typechecks templates against the built package exports', () => {
    expect(templateDiagnostics(true)).toEqual([])
  }, 20000)
})
