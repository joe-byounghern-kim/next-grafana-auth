'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

export default function HomePage() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>
        next-grafana-auth - NextAuth.js Example
      </h1>
      <p style={{ marginBottom: '2rem', lineHeight: '1.6' }}>
        This example demonstrates how to integrate{' '}
        <a
          href="https://next-auth.js.org"
          style={{ color: '#3b82f6' }}
          target="_blank"
          rel="noopener noreferrer"
        >
          NextAuth.js
        </a>{' '}
        with{' '}
        <a
          href="https://github.com/joe-byounghern-kim/nextjs-proxied-grafana-embedding"
          style={{ color: '#3b82f6' }}
        >
          next-grafana-auth
        </a>
        {' '}
        for authentication.
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
          <li>NextAuth.js for authentication</li>
          <li>Session-based auth with JWT</li>
          <li>Role-based access control</li>
          <li>Custom sign-in page</li>
          <li>User info in dashboard header</li>
        </ul>
      </div>

      <h2 style={{ marginBottom: '1rem' }}>Get Started</h2>
      <ol style={{ marginBottom: '2rem', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
        <li>
          Set environment variables in <code>.env</code>:
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
            NEXTAUTH_SECRET=your-secret-key-here
            NEXTAUTH_URL=http://localhost:3000
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
            cd nextauth
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
          <code>app/api/auth/[...nextauth]/route.ts</code> - NextAuth
          configuration
        </li>
        <li>
          <code>app/api/grafana/[...path]/route.ts</code> - Proxy route with
          session validation
        </li>
        <li>
          <code>app/signin/page.tsx</code> - Custom sign-in page
        </li>
        <li>
          <code>app/dashboard/page.tsx</code> - Dashboard with embedded Grafana
        </li>
      </ul>
    </div>
  )
}
