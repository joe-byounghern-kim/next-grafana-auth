import path from 'node:path'

const workspaceRoot = path.join(process.cwd(), '..')

const nextConfig = {
  outputFileTracingRoot: workspaceRoot,
  turbopack: {
    root: workspaceRoot,
  },
}

export default nextConfig
