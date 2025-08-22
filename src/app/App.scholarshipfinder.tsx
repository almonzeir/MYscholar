import React from 'react'
import { SearchApp } from '@/components/features/SearchApp'
import { ClientBackground3D } from '@/components/ui'

export default function ScholarshipFinderApp() {
  return (
    <div className="relative min-h-screen bg-surface-900 overflow-hidden">
      <ClientBackground3D className="fixed inset-0 z-0" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x mb-2">
              MyScholar
            </h1>
            <p className="text-lg text-white/80">
              AI-powered scholarship matching platform
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 pb-12">
          <SearchApp />
        </main>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 text-center">
          <p className="text-white/60 text-sm">
            © 2024 MyScholar. Helping students find their perfect scholarships.
          </p>
        </footer>
      </div>
    </div>
  )
}