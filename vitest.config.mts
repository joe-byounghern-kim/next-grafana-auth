import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/index.ts', 'src/utils.ts'],
      reporter: ['text', 'json-summary'],
      thresholds: {
        perFile: true,
        // Rounded down from the measured core baseline, never averaged together.
        'src/index.ts': { statements: 90, branches: 85, functions: 90, lines: 90 },
        'src/utils.ts': { statements: 90, branches: 90, functions: 100, lines: 90 },
      },
    },
  },
})
