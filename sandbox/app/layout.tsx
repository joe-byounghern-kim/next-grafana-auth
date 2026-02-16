import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'next-grafana-auth - Sandbox',
  description: 'Testing environment for next-grafana-auth package',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
