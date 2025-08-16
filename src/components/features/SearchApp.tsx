'use client'

import React, { useState, useCallback } from 'react'
import { ClientBackground3D } from '../ui'
import { ErrorBoundary, useError } from '@/components/error'
import CVUpload from './CVUpload'
import GuidedQuestionnaire from './GuidedQuestionnaire'
import SearchResults from './SearchResults'
import ScholarshipDetail from './ScholarshipDetail'

type AppState = 'landing' | 'cv-upload' | 'questionnaire' | 'results' | 'detail'

interface UserProfile {
  nationality: string
  degreeTarget: string
  fieldKeywords: string[]
  specialStatus: string[]
  gpa?: number
  languageTests?: Record<string, any>
  publications?: number
  workExperience?: number
  constraints: Record<string, any>
}

interface Scholarship {
  id: string
  name: string
  sourceUrl: string
  domain: string
  country: string
  degreeLevels: string[]
  fields: string[]
  deadline: Date | string
  stipend?: number
  tuitionCovered: boolean
  travelSupport: boolean
  eligibilityText: string
  requirements: string[]
  tags: string[]
  matchScore: number
  matchReasons: string[]
  llmRationale?: string
  applicationTips?: string[]
  potentialConcerns?: string[]
}

export default function SearchApp() {
  const [appState, setAppState] = useState<AppState>('landing')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null)
  const { reportError, showErrorToast } = useError()

  const handleCVUpload = useCallback((file: File) => {
    try {
      // In a real implementation, this would call the CV parsing API
      // CV uploaded successfully
      
      // Simulate CV parsing result
      setTimeout(() => {
        const mockProfile: UserProfile = {
          nationality: 'US',
          degreeTarget: 'master',
          fieldKeywords: ['computer science', 'machine learning'],
          specialStatus: [],
          gpa: 3.7,
          languageTests: { TOEFL: 105 },
          publications: 2,
          workExperience: 12,
          constraints: {}
        }
        
        setUserProfile(mockProfile)
        setAppState('results')
      }, 2000)
      
      showErrorToast('CV processed successfully!', 'low')
    } catch (error) {
      reportError(error instanceof Error ? error : new Error('CV upload failed'), {
        component: 'SearchApp',
        action: 'handleCVUpload',
        fileName: file.name
      })
      showErrorToast('Failed to process CV. Please try again.', 'high')
    }
  }, [reportError, showErrorToast])

  const handleQuestionnaireComplete = useCallback((profile: UserProfile) => {
    try {
      setUserProfile(profile)
      setAppState('results')
      
      showErrorToast('Profile created successfully!', 'low')
    } catch (error) {
      reportError(error instanceof Error ? error : new Error('Questionnaire completion failed'), {
        component: 'SearchApp',
        action: 'handleQuestionnaireComplete',
        profile
      })
      showErrorToast('Failed to process questionnaire. Please try again.', 'high')
    }
  }, [reportError, showErrorToast])

  const handleScholarshipSelect = useCallback((scholarship: Scholarship) => {
    try {
      setSelectedScholarship(scholarship)
      setAppState('detail')
    } catch (error) {
      reportError(error instanceof Error ? error : new Error('Scholarship selection failed'), {
        component: 'SearchApp',
        action: 'handleScholarshipSelect',
        scholarshipId: scholarship?.id
      })
      showErrorToast('Failed to load scholarship details. Please try again.', 'medium')
    }
  }, [reportError, showErrorToast])

  const handleBackToResults = useCallback(() => {
    setSelectedScholarship(null)
    setAppState('results')
  }, [])

  const handleStartOver = useCallback(() => {
    setUserProfile(null)
    setSelectedScholarship(null)
    setAppState('landing')
  }, [])

  const renderContent = () => {
    switch (appState) {
      case 'landing':
        return (
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
                  <button 
                    className="btn-primary"
                    onClick={() => setAppState('cv-upload')}
                  >
                    Upload CV
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => setAppState('questionnaire')}
                  >
                    Guided Q&A
                  </button>
                </div>
                
                {/* Trust indicators */}
                <div className="mt-16 flex flex-wrap justify-center items-center gap-8 opacity-60 animate-fade-in-up animation-delay-600">
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
        )

      case 'cv-upload':
        return (
          <div className="relative z-10 container mx-auto px-4 py-16 min-h-screen flex items-center">
            <div className="w-full">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-4">
                  Upload Your CV
                </h1>
                <p className="text-white/70 max-w-2xl mx-auto">
                  We&apos;ll analyze your CV to extract your academic background, skills, and experience 
                  to find the most relevant scholarship opportunities.
                </p>
              </div>
              
              <CVUpload
                onFileSelect={handleCVUpload}
                onUploadComplete={(result) => {
                  // Upload completed successfully
                }}
              />
              
              <div className="text-center mt-8">
                <button 
                  className="btn-ghost"
                  onClick={() => setAppState('landing')}
                >
                  ← Back to options
                </button>
              </div>
            </div>
          </div>
        )

      case 'questionnaire':
        return (
          <div className="relative z-10 container mx-auto px-4 py-16 min-h-screen">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-4">
                Tell Us About Yourself
              </h1>
              <p className="text-white/70 max-w-2xl mx-auto">
                Answer a few questions about your academic background and goals 
                to get personalized scholarship recommendations.
              </p>
            </div>
            
            <GuidedQuestionnaire
              onComplete={handleQuestionnaireComplete}
              onStepChange={(step, total) => {
                // Processing step
              }}
            />
            
            <div className="text-center mt-8">
              <button 
                className="btn-ghost"
                onClick={() => setAppState('landing')}
              >
                ← Back to options
              </button>
            </div>
          </div>
        )

      case 'results':
        return (
          <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Your Scholarship Matches
                </h1>
                <p className="text-white/70">
                  Based on your profile: {userProfile?.degreeTarget} in {userProfile?.fieldKeywords.join(', ')}
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <button 
                  className="btn-ghost"
                  onClick={handleStartOver}
                >
                  Start Over
                </button>
              </div>
            </div>
            
            <SearchResults
              profile={userProfile}
              onScholarshipSelect={handleScholarshipSelect}
            />
          </div>
        )

      case 'detail':
        return (
          <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen">
            <ScholarshipDetail
              scholarship={selectedScholarship!}
              userProfile={userProfile!}
              onBack={handleBackToResults}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <ErrorBoundary
      level="page"
      onError={(error, errorInfo) => {
        reportError(error, {
          component: 'SearchApp',
          appState,
          hasProfile: !!userProfile,
          errorInfo
        })
      }}
    >
      <main className="relative min-h-screen bg-surface-900 overflow-hidden">
      {/* 3D Background */}
      <ClientBackground3D className="fixed inset-0 z-0" />
      
        {/* Content */}
        {renderContent()}
      </main>
    </ErrorBoundary>
  )
}