import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/component.tsx'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['next', 'react', 'react-dom'],
  banner: {
    js: `/* @preserve */
/**
 * next-grafana-auth v1.0.0
 * Embed Grafana dashboards in Next.js with auth-proxy authentication
 * https://github.com/joe-byounghern-kim/nextjs-proxied-grafana-embedding
 */`,
  },
})
