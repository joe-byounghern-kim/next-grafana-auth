'use client'

import { useState } from 'react'

export default function HomePage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isTesting, setIsTesting] = useState(false)

  function addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev])
  }

  async function runTests() {
    setIsTesting(true)
    addLog('Starting tests...')
    addLog('================================')

    // Test 1: Check environment
    addLog('TEST 1: Checking environment...')
    try {
      const response = await fetch('/api/grafana/api/health')
      if (response.ok) {
        const health = await response.json()
        addLog(`✅ Grafana is running: ${health.commit} (${health.database})`)
      } else {
        addLog('❌ Grafana health check failed')
      }
    } catch {
      addLog('❌ Cannot reach Grafana proxy')
    }
    addLog('')

    // Test 2: Check proxy endpoint
    addLog('TEST 2: Checking proxy endpoint...')
    try {
      const response = await fetch('/api/grafana/api/health?probe=proxy')
      if (response.ok) {
        addLog('✅ Proxy endpoint is responding')
      } else {
        addLog(`❌ Proxy returned status: ${response.status}`)
      }
    } catch {
      addLog('❌ Proxy endpoint error')
    }
    addLog('')

    addLog('Automated checks complete. Open the dashboard to verify the rendered panels.')
    setIsTesting(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        padding: '1rem 2rem',
        background: '#1a1a1a',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
            next-grafana-auth - Sandbox
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#9ca3af', fontSize: '0.9rem' }}>
            Testing environment for evaluating the package
          </p>
        </div>
        <a
          href="/dashboard"
          style={{
            padding: '0.5rem 1.5rem',
            background: '#3b82f6',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '0.25rem',
            fontWeight: 'bold',
          }}
        >
          View Dashboard →
        </a>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr 1fr' }}>
          {/* Left Column: Instructions */}
          <div>
            <h2 style={{ marginBottom: '1rem' }}>📋 Setup Instructions</h2>
            <ol style={{ lineHeight: '1.8', paddingLeft: '1.5rem' }}>
              <li>
                <strong>From the repository root, run the canonical setup:</strong>
                <pre style={{
                  background: '#1f2937',
                  color: '#f9fafb',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  marginTop: '0.5rem',
                  marginBottom: '1rem',
                }}>
                  ./sandbox/quick-start.sh
                </pre>
              </li>
              <li>
                The script builds the root package, starts the canonical Grafana stack,
                validates its provisioned resources, and starts this sandbox.
              </li>
              <li>
                <strong>Visit:</strong> http://localhost:3000 or open the dashboard above.
              </li>
            </ol>

            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              background: '#dbeafe',
              border: '1px solid #3b82f6',
              borderRadius: '0.5rem',
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>
                💡 Canonical infrastructure
              </h3>
              <p style={{ margin: 0, color: '#1e3a8a', lineHeight: '1.6' }}>
                Grafana configuration and provisioning live under <code>examples/</code>.{' '}
                The sandbox does not maintain a second Compose stack.
              </p>
            </div>

            <h2 style={{ marginBottom: '1rem', marginTop: '2rem' }}>
              🧪 What to Test
            </h2>
            <ul style={{ lineHeight: '1.8', paddingLeft: '1.5rem' }}>
              <li>✅ Dashboard loads in iframe</li>
              <li>✅ Charts display correctly</li>
              <li>✅ Kiosk mode active (no UI)</li>
              <li>✅ Dark theme applied</li>
              <li>✅ The five provisioned panels render</li>
              <li>✅ Time range and refresh controls work</li>
              <li>✅ No auth errors in console</li>
            </ul>

            <h2 style={{ marginBottom: '1rem', marginTop: '2rem' }}>
              🐛 Troubleshooting
            </h2>
            <ul style={{ lineHeight: '1.8', paddingLeft: '1.5rem' }}>
              <li>
                <strong>Dashboard blank:</strong> Run <code>scripts/verify-grafana.sh</code>{' '}
                from the repository root.
              </li>
              <li>
                <strong>401 Unauthorized:</strong> Check the server-derived identity and role.
              </li>
              <li>
                <strong>404 Not Found:</strong> Check route, proxy prefix, and Grafana sub-path alignment.
              </li>
              <li>
                See <code>TROUBLESHOOTING.md</code> for the symptom-first checklist.
              </li>
            </ul>

            <h2 style={{ marginBottom: '1rem', marginTop: '2rem' }}>
              🧹 Cleanup
            </h2>
            <pre style={{
              background: '#1f2937',
              color: '#f9fafb',
              padding: '1rem',
              borderRadius: '0.5rem',
            }}>
              docker compose --project-directory examples -f examples/docker-compose.yml down

              # Add -v to delete local Grafana data.
            </pre>
          </div>

          {/* Right Column: Testing Console */}
          <div>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>🖥️ Testing Console</h2>
              <button
                type="button"
                onClick={runTests}
                disabled={isTesting}
                style={{
                  padding: '0.5rem 1.5rem',
                  background: isTesting ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: isTesting ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                }}
              >
                {isTesting ? 'Running...' : 'Run Tests'}
              </button>
            </div>

            <div style={{
              background: '#111827',
              color: '#10b981',
              padding: '1rem',
              borderRadius: '0.5rem',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              height: '500px',
              overflowY: 'auto',
              border: '1px solid #374151',
            }}>
              {logs.length === 0 ? (
                <span style={{ color: '#6b7280' }}>Click "Run Tests" to begin...</span>
              ) : (
                logs.map(log => (
                  <div key={log} style={{ marginBottom: '0.25rem' }}>
                    {log}
                  </div>
                ))
              )}
            </div>

            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '0.5rem',
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>
                ⚠️ Demo Dashboard
              </h3>
              <p style={{ margin: 0, color: '#92400e', lineHeight: '1.6', fontSize: '0.9rem' }}>
                The sandbox uses a pre-configured Grafana demo dashboard backed by TestData random-walk data.
                If you don't see the dashboard, check that Grafana is running:
                <code>docker compose ps</code>
              </p>
              <p style={{ margin: '0.5rem 0 0 0', color: '#92400e', lineHeight: '1.6', fontSize: '0.9rem' }}>
                To create your own dashboard:
              </p>
              <ol style={{ margin: 0, paddingLeft: '1.5rem', color: '#92400e', lineHeight: '1.6', fontSize: '0.9rem' }}>
                <li>Access Grafana directly: <a href="http://localhost:3001/api/grafana" target="_blank" rel="noopener noreferrer" style={{ color: '#92400e', textDecoration: 'underline' }}>http://localhost:3001/api/grafana</a></li>
                <li>Create a new dashboard</li>
                <li>Copy the Dashboard UID</li>
                <li>Update <code>sandbox/app/dashboard/page.tsx</code> with the UID</li>
              </ol>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '1rem 2rem',
        background: '#1a1a1a',
        color: '#9ca3af',
        textAlign: 'center',
        borderTop: '1px solid #374151',
      }}>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          next-grafana-auth Sandbox • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  )
}
