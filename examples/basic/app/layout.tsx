import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'next-grafana-auth Basic Example',
  description: 'Minimal example of embedding Grafana with next-grafana-auth',
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
