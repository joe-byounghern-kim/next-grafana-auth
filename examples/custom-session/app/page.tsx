'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/user')
        if (response.ok) {
          router.push('/dashboard')
        }
      } catch {
        // Not authenticated, stay on home page
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>
        next-grafana-auth - Custom Session Example
      </h1>
      <p style={{ marginBottom: '2rem', lineHeight: '1.6' }}>
        This example demonstrates a custom session-based authentication system with{' '}
        <a
          href="https://github.com/joe-byounghern-kim/next-grafana-auth"
          style={{ color: '#3b82f6' }}
        >
          next-grafana-auth
        </a>
        . Similar to production implementations like Operator Client (OC).
      </p>

      <div
        style={{
          padding: '1.5rem',
          background: '#f3f4f6',
          borderRadius: '0.5rem',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ marginBottom: '1rem' }}>Features</h2>
        <ul style={{ lineHeight: '1.8', paddingLeft: '1.5rem' }}>
          <li>Custom session management (in-memory store)</li>
          <li>Session-based authentication</li>
          <li>Role-based access control</li>
          <li>Custom sign-in/sign-out endpoints</li>
          <li>User info API endpoint</li>
          <li>Session expiration and cleanup</li>
        </ul>
      </div>

      <h2 style={{ marginBottom: '1rem' }}>Get Started</h2>
      <ol style={{ marginBottom: '2rem', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
        <li>
          Set environment variable in <code>.env</code>:
          <pre
            style={{
              background: '#1f2937',
              color: '#f9fafb',
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
          Install dependencies:
          <pre
            style={{
              background: '#f3f4f6',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginTop: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            npm ci
          </pre>
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
            cd custom-session
            npm run dev
          </pre>
        </li>
      </ol>

      <a
        href="/signin"
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
        Sign In →
      </a>

      <h2 style={{ marginBottom: '1rem', marginTop: '2rem' }}>Files</h2>
      <ul style={{ lineHeight: '1.8' }}>
        <li>
          <code>app/lib/session.ts</code> - Session management utilities
        </li>
        <li>
          <code>app/api/auth/signin/route.ts</code> - Sign-in endpoint
        </li>
        <li>
          <code>app/api/auth/signout/route.ts</code> - Sign-out endpoint
        </li>
        <li>
          <code>app/api/auth/user/route.ts</code> - User info endpoint
        </li>
        <li>
          <code>app/api/grafana/[...path]/route.ts</code> - Proxy route with
          session validation
        </li>
        <li>
          <code>app/signin/page.tsx</code> - Sign-in page
        </li>
        <li>
          <code>app/dashboard/page.tsx</code> - Dashboard with embedded Grafana
        </li>
      </ul>

      <div
        style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '0.5rem',
        }}
      >
        <h3 style={{ marginBottom: '0.5rem', color: '#92400e' }}>
          ⚠️ Production Notes
        </h3>
        <p style={{ color: '#92400e', lineHeight: '1.6' }}>
          This example uses in-memory session storage for simplicity. In production:
        </p>
        <ul style={{ paddingLeft: '1.5rem', color: '#92400e', lineHeight: '1.6' }}>
          <li>Use Redis, database, or external session store</li>
          <li>Implement proper password hashing (bcrypt, argon2)</li>
          <li>Use HTTPS for all communications</li>
          <li>Implement rate limiting</li>
          <li>Add input validation and sanitization</li>
        </ul>
      </div>
    </div>
  )
}
