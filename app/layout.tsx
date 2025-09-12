import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AnyLingo - Revolutionary Language Learning',
  description: 'Transform your language learning journey with AI-driven subconscious training.',
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