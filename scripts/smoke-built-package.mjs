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
