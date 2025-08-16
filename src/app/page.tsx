import React from 'react'
import Link from 'next/link'
import { ClientBackground3D } from '../components/ui'

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-surface-900 overflow-hidden">
      {/* 3D Background */}
      <ClientBackground3D className="fixed inset-0 z-0" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">
        {/* Logo and Branding */}
        <div className="w-full text-center pt-8 mb-16">
          <div className="animate-fade-in-up">
            {/* MyScholar Logo */}
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <h1 className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x">
                  MyScholar
                </h1>
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-primary to-accent rounded-full animate-pulse"></div>
              </div>
            </div>
            
            {/* Tagline */}
            <p className="text-2xl md:text-3xl font-semibold text-white/90 mb-2 animate-fade-in-up animation-delay-200">
              Stop guessing. Let AI match you.
            </p>
            
            {/* Subtitle */}
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto mb-8 animate-fade-in-up animation-delay-300"></div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex items-center">
          <div className="w-full text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in-up animation-delay-400">
              Find Your Perfect
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent ml-3">
                Scholarship
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto animate-fade-in-up animation-delay-500">
              Upload your CV or answer a few questions to discover scholarship opportunities 
              tailored specifically for your academic journey.
            </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-600">
            <Link href="/search" className="btn-primary">
              Get Started
            </Link>
            <Link href="/search" className="btn-secondary">
              Learn More
            </Link>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap justify-center items-center gap-8 opacity-60 animate-fade-in-up animation-delay-700">
            <div className="chip">
              <span className="text-xs">🎓 1000+ Scholarships</span>
            </div>
            <div className="chip">
              <span className="text-xs">🌍 50+ Countries</span>
            </div>
            <div className="chip">
              <span className="text-xs">⚡ AI-Powered Matching</span>
            </div>
          </div>
          </div>
        </div>
      </div>
    </main>
  )
}