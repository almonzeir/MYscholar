import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
import './globals.css'
import { ErrorProvider, ErrorBoundary } from '@/components/error'

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
        <ErrorProvider
          maxErrors={100}
          showToasts={true}
          autoReportReactErrors={true}
        >
          <ErrorBoundary
            level="page"
            onError={(error, errorInfo) => {
              // Additional page-level error handling if needed
              console.error('Page-level error:', error, errorInfo)
            }}
          >
            {children}
          </ErrorBoundary>
        </ErrorProvider>
      </body>
    </html>
  )
}