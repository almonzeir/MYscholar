import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
import './globals.css'
import { Providers } from './providers';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

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
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased bg-surface-900 text-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}