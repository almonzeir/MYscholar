import type { Metadata } from 'next'
import React from 'react'
import './globals.css'
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'MyScholar - Stop guessing. Let AI match you.',
  description: 'AI-powered scholarship matching platform. Upload your CV or answer questions to discover personalized scholarship opportunities.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-surface-900 text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}