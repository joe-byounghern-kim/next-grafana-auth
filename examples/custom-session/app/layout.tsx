import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'next-grafana-auth - Custom Session Example',
  description: 'Custom session-based auth with next-grafana-auth (OC-like)',
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
