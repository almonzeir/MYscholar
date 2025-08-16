import React from 'react'
import Link from 'next/link'
import { Card, Button } from '@/components/ui'

export default function PremiumSuccessPage() {
  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="text-success mb-6">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">
          Welcome to Premium!
        </h1>
        
        <p className="text-white/70 mb-6">
          Your subscription has been activated successfully. You now have access to all premium features including unlimited searches, AI insights, and CSV exports.
        </p>
        
        <div className="space-y-3">
          <Link href="/search">
            <button className="btn-primary w-full">
              Start Searching
            </button>
          </Link>
          
          <Link href="/search">
            <button className="btn-secondary w-full">
              View Profile
            </button>
          </Link>
        </div>
        
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-white/60 text-sm">
            Questions? Contact our support team at{' '}
            <a href="mailto:support@scholarshipplatform.com" className="text-primary hover:underline">
              support@scholarshipplatform.com
            </a>
          </p>
        </div>
      </Card>
    </div>
  )
}