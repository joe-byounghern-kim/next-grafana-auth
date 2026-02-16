export default function HomePage() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>
        next-grafana-auth - Basic Example
      </h1>
      <p style={{ marginBottom: '2rem', lineHeight: '1.6' }}>
        This is a minimal example demonstrating how to embed Grafana dashboards
        in Next.js using the{' '}
        <a
          href="https://github.com/joe-byounghern-kim/nextjs-proxied-grafana-embedding"
          style={{ color: '#3b82f6' }}
        >
          next-grafana-auth
        </a>{' '}
        package.
      </p>

      <h2 style={{ marginBottom: '1rem' }}>Setup</h2>
      <ol style={{ marginBottom: '2rem', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
        <li>
          Set <code>GRAFANA_INTERNAL_URL</code> in <code>.env</code>:
          <pre
            style={{
              background: '#f3f4f6',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginTop: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            GRAFANA_INTERNAL_URL=http://localhost:3001
          </pre>
        </li>
        <li>
          A placeholder dashboard is provisioned automatically ({' '}
          <code>examples/provisioning/dashboards/json/demo-dashboard.json</code>).
        </li>
        <li>
          Start Grafana and Next.js:
          <pre
            style={{
              background: '#f3f4f6',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginTop: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            cd ..
            docker compose up -d
            cd basic
            npm ci
            npm run dev
          </pre>
        </li>
      </ol>

      <h2 style={{ marginBottom: '1rem' }}>View Dashboard</h2>
      <a
        href="/dashboard"
        style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          background: '#3b82f6',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '0.5rem',
          fontWeight: 'bold',
        }}
      >
        Open Embedded Dashboard →
      </a>

      <h2 style={{ marginBottom: '1rem', marginTop: '2rem' }}>Files</h2>
      <ul style={{ lineHeight: '1.8' }}>
        <li>
          <code>app/api/grafana/[...path]/route.ts</code> - Proxy route handler
          (40 lines)
        </li>
        <li>
          <code>app/dashboard/page.tsx</code> - Dashboard page (15 lines)
        </li>
        <li>Total user code: ~55 lines</li>
      </ul>
    </div>
  )
}
