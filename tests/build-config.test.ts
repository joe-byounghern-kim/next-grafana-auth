import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import tsupConfig from '../tsup.config'

describe('build metadata', () => {
  it('should stamp bundles with the package version', () => {
    const packageVersion = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf8')
    ).version as string
    const config = tsupConfig as { banner?: { js?: string } }

    expect(config.banner?.js).toContain(`next-grafana-auth v${packageVersion}`)
  })
})
