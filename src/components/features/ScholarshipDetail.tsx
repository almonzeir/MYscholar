'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Chip, Progress, Skeleton } from '../ui'
import { cn } from '@/lib/utils'

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

interface ScholarshipDetailProps {
  scholarship: Scholarship
  userProfile: UserProfile
  onBack: () => void
  className?: string
}

interface EnhancedDetails {
  enhancedDescription: string
  personalizedHighlights: string[]
  applicationStrategy: string
  fullDescription?: string
  applicationProcess?: string[]
  selectionCriteria?: string[]
  benefits?: string[]
  contactInfo?: {
    email?: string
    website: string
    phone?: string
  }
}

export default function ScholarshipDetail({
  scholarship,
  userProfile,
  onBack,
  className
}: ScholarshipDetailProps) {
  const [enhancedDetails, setEnhancedDetails] = useState<EnhancedDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch enhanced details
  useEffect(() => {
    const fetchEnhancedDetails = async () => {
      setLoading(true)
      setError(null)

      try {
        // First, try to get detailed scholarship info
        const detailResponse = await fetch(`/api/scholarships/${scholarship.id}`)
        let detailedScholarship = scholarship

        if (detailResponse.ok) {
          const detailData = await detailResponse.json()
          if (detailData.success) {
            detailedScholarship = { ...scholarship, ...detailData.data }
          }
        }

        // Then get AI enhancement
        const aiResponse = await fetch('/api/ai/recommendations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            profile: userProfile,
            scholarships: [detailedScholarship],
            type: 'enhancement'
          })
        })

        if (aiResponse.ok) {
          const aiData = await aiResponse.json()
          if (aiData.success) {
            setEnhancedDetails({
              enhancedDescription: aiData.data.enhancedDescription,
              personalizedHighlights: aiData.data.personalizedHighlights,
              applicationStrategy: aiData.data.applicationStrategy,
              ...detailedScholarship
            })
          } else {
            throw new Error(aiData.error || 'Failed to get AI enhancement')
          }
        } else {
          // Fallback to basic details
          setEnhancedDetails({
            enhancedDescription: scholarship.eligibilityText,
            personalizedHighlights: scholarship.matchReasons,
            applicationStrategy: 'Review all requirements carefully and prepare a strong application.',
            ...detailedScholarship
          })
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load details')
        // Fallback to basic scholarship info
        setEnhancedDetails({
          enhancedDescription: scholarship.eligibilityText,
          personalizedHighlights: scholarship.matchReasons,
          applicationStrategy: 'Review all requirements carefully and prepare a strong application.'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEnhancedDetails()
  }, [scholarship, userProfile])

  // Utility function to safely format dates
  const formatDateSafely = (date: Date | string | null | undefined): string => {
    if (!date) return 'Not specified'
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        return 'Invalid date'
      }
      
      return dateObj.toLocaleDateString()
    } catch (error) {
      return 'Invalid date'
    }
  }

  // Format deadline
  const formatDeadline = (deadline: Date | string) => {
    const now = new Date()
    let deadlineDate: Date
    
    try {
      deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline
      
      // Check if the date is valid
      if (isNaN(deadlineDate.getTime())) {
        return { text: 'Invalid date', color: 'text-error', urgent: false }
      }
    } catch (error) {
      return { text: 'Invalid date', color: 'text-error', urgent: false }
    }
    
    const diffTime = deadlineDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { text: 'Expired', color: 'text-error', urgent: false }
    } else if (diffDays <= 7) {
      return { text: `${diffDays} days left`, color: 'text-error', urgent: true }
    } else if (diffDays <= 30) {
      return { text: `${diffDays} days left`, color: 'text-warning', urgent: true }
    } else {
      return { text: deadlineDate.toLocaleDateString(), color: 'text-white/60', urgent: false }
    }
  }

  const deadline = formatDeadline(scholarship.deadline)

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center space-x-4 mb-6">
          <Skeleton width={100} height={40} />
          <Skeleton width={200} height={32} />
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <Skeleton variant="title" className="mb-4" />
              <Skeleton variant="text" className="mb-2" />
              <Skeleton variant="text" className="mb-2" />
              <Skeleton variant="text" width="60%" />
            </Card>
            
            <Card className="p-6">
              <Skeleton variant="title" className="mb-4" />
              <div className="space-y-2">
                <Skeleton variant="text" />
                <Skeleton variant="text" />
                <Skeleton variant="text" width="80%" />
              </div>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card className="p-6">
              <Skeleton variant="title" className="mb-4" />
              <div className="space-y-3">
                <Skeleton width={120} height={24} />
                <Skeleton width={100} height={24} />
                <Skeleton width={140} height={24} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← Back to Results
        </Button>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            onClick={() => window.open(scholarship.sourceUrl, '_blank')}
          >
            Visit Official Page
          </Button>
          <Button variant="primary">
            Save Scholarship
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column - Main details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title and basic info */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-3">
                  {scholarship.name}
                </h1>
                
                <div className="flex items-center space-x-4 text-white/60 mb-4">
                  <span>{scholarship.country}</span>
                  <span>•</span>
                  <span>{scholarship.degreeLevels.join(', ')}</span>
                  <span>•</span>
                  <span className={deadline.color}>
                    Deadline: {deadline.text}
                    {deadline.urgent && ' ⚠️'}
                  </span>
                </div>

                <div className="flex items-center space-x-2 mb-4">
                  <div className="text-2xl font-bold text-success">
                    {scholarship.matchScore}% Match
                  </div>
                  <Chip variant="success" size="sm">
                    Excellent Fit
                  </Chip>
                </div>
              </div>
            </div>

            {/* Enhanced description */}
            {enhancedDetails && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="text-primary mt-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2">AI Analysis</h3>
                    <p className="text-white/80">{enhancedDetails.enhancedDescription}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {scholarship.tags.map((tag) => (
                <Chip key={tag} variant="default">
                  {tag}
                </Chip>
              ))}
            </div>
          </Card>

          {/* Personalized highlights */}
          {enhancedDetails?.personalizedHighlights && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Why This Matches Your Profile
              </h2>
              <div className="space-y-3">
                {enhancedDetails.personalizedHighlights.map((highlight, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="text-success mt-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-white/80">{highlight}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Application strategy */}
          {enhancedDetails?.applicationStrategy && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Application Strategy
              </h2>
              <p className="text-white/80 mb-4">{enhancedDetails.applicationStrategy}</p>
              
              {scholarship.applicationTips && (
                <div>
                  <h3 className="font-semibold text-white mb-3">AI-Generated Tips:</h3>
                  <ul className="space-y-2">
                    {scholarship.applicationTips.map((tip, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-white/80">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {/* Requirements */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Requirements
            </h2>
            <div className="space-y-2">
              {scholarship.requirements.map((requirement, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="text-white/40 mt-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-white/80">{requirement}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Potential concerns */}
          {scholarship.potentialConcerns && scholarship.potentialConcerns.length > 0 && (
            <Card className="p-6 border-warning/30 bg-warning/5">
              <h2 className="text-xl font-semibold text-white mb-4">
                Things to Consider
              </h2>
              <div className="space-y-2">
                {scholarship.potentialConcerns.map((concern, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="text-warning mt-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-white/80">{concern}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right column - Quick info */}
        <div className="space-y-6">
          {/* Financial details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Financial Support
            </h3>
            
            <div className="space-y-4">
              {scholarship.stipend && (
                <div>
                  <div className="text-2xl font-bold text-success mb-1">
                    €{scholarship.stipend.toLocaleString()}/month
                  </div>
                  <p className="text-sm text-white/60">Monthly stipend</p>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Tuition</span>
                  <span className={scholarship.tuitionCovered ? 'text-success' : 'text-white/60'}>
                    {scholarship.tuitionCovered ? 'Covered' : 'Not covered'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Travel Support</span>
                  <span className={scholarship.travelSupport ? 'text-success' : 'text-white/60'}>
                    {scholarship.travelSupport ? 'Included' : 'Not included'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Important Dates
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Application Deadline</span>
                <span className={deadline.color}>
                  {formatDateSafely(scholarship.deadline)}
                </span>
              </div>
              
              {deadline.urgent && (
                <div className="bg-error/10 border border-error/30 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="text-error">⚠️</div>
                    <span className="text-sm text-error font-medium">
                      Deadline approaching soon!
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Source info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Source Information
            </h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-white/60 mb-1">Official Website</p>
                <Chip variant="default">{scholarship.domain}</Chip>
              </div>
              
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => window.open(scholarship.sourceUrl, '_blank')}
              >
                Visit Official Page
              </Button>
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Quick Actions
            </h3>
            
            <div className="space-y-3">
              <Button variant="primary" className="w-full">
                Save to Favorites
              </Button>
              
              <Button variant="secondary" className="w-full">
                Share Scholarship
              </Button>
              
              <Button variant="ghost" className="w-full">
                Report Issue
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}