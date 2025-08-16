'use client'

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge as Chip } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorBoundary, useError } from '@/components/error'
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

interface SearchFilters {
  countries?: string[]
  degreeLevels?: string[]
  fields?: string[]
  deadlineBefore?: Date
  minStipend?: number
  search?: string
}

interface ProcessingStage {
  name: string
  status: 'pending' | 'processing' | 'complete' | 'error'
  progress?: number
}

interface SearchResultsProps {
  profile: any
  filters?: SearchFilters
  onScholarshipSelect?: (scholarship: Scholarship) => void
  onFiltersChange?: (filters: SearchFilters) => void
  className?: string
}

// Memoized scholarship card component for better performance
const ScholarshipCard = memo(({ 
  scholarship, 
  onSelect 
}: { 
  scholarship: Scholarship
  onSelect?: (scholarship: Scholarship) => void 
}) => {
  const deadline = useMemo(() => {
    const formatDeadline = (date: Date) => {
      const now = new Date()
      const diffTime = date.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays < 0) {
        return { text: 'Expired', color: 'text-error', urgent: false }
      } else if (diffDays === 0) {
        return { text: 'Due today', color: 'text-error', urgent: true }
      } else if (diffDays <= 7) {
        return { text: `${diffDays} days left`, color: 'text-warning', urgent: true }
      } else if (diffDays <= 30) {
        return { text: `${diffDays} days left`, color: 'text-warning', urgent: false }
      } else {
        return { text: `${diffDays} days left`, color: 'text-white/60', urgent: false }
      }
    }
    return formatDeadline(typeof scholarship.deadline === 'string' ? new Date(scholarship.deadline) : scholarship.deadline)
  }, [scholarship.deadline])

  const matchColor = useMemo(() => {
    const getMatchScoreColor = (score: number) => {
      if (score >= 80) return 'text-success'
      if (score >= 60) return 'text-warning'
      return 'text-white/60'
    }
    return getMatchScoreColor(scholarship.matchScore)
  }, [scholarship.matchScore])

  return (
    <Card
      variant="glass-hover"
      className="p-6 cursor-pointer"
      onClick={() => onSelect?.(scholarship)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-xl font-semibold text-white">
              {scholarship.name}
            </h3>
            <div className={cn('text-sm font-medium', matchColor)}>
              {scholarship.matchScore}% match
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-white/60 mb-3">
            <span>{scholarship.country}</span>
            <span>•</span>
            <span>{scholarship.degreeLevels.join(', ')}</span>
            <span>•</span>
            <span className={deadline.color}>
              {deadline.text}
              {deadline.urgent && ' ⚠️'}
            </span>
          </div>

          <p className="text-white/80 mb-4 line-clamp-2">
            {scholarship.eligibilityText}
          </p>

          {/* Match reasons */}
          {scholarship.matchReasons.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-white mb-2">Why this matches:</h4>
              <div className="flex flex-wrap gap-2">
                {scholarship.matchReasons.slice(0, 3).map((reason, i) => (
                  <Chip key={i} variant="success" size="sm">
                    {reason}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {/* AI insights */}
          {scholarship.llmRationale && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-2">
                <div className="text-primary mt-0.5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <p className="text-sm text-white/80">{scholarship.llmRationale}</p>
              </div>
            </div>
          )}
        </div>

        <div className="text-right ml-6">
          {scholarship.stipend && (
            <div className="text-lg font-semibold text-success mb-1">
              €{scholarship.stipend.toLocaleString()}/month
            </div>
          )}
          
          <div className="space-y-1 text-xs text-white/60">
            {scholarship.tuitionCovered && (
              <div className="flex items-center">
                <span className="text-success">✓</span>
                <span className="ml-1">Tuition covered</span>
              </div>
            )}
            {scholarship.travelSupport && (
              <div className="flex items-center">
                <span className="text-success">✓</span>
                <span className="ml-1">Travel support</span>
              </div>
            )}
          </div>

          <div className="mt-3">
            <Chip variant="default" size="sm">
              {scholarship.domain}
            </Chip>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {scholarship.tags.slice(0, 4).map((tag) => (
          <Chip key={tag} variant="default" size="sm">
            {tag}
          </Chip>
        ))}
        {scholarship.tags.length > 4 && (
          <Chip variant="default" size="sm">
            +{scholarship.tags.length - 4} more
          </Chip>
        )}
      </div>
    </Card>
  )
})

ScholarshipCard.displayName = 'ScholarshipCard'

function SearchResults({
  profile,
  filters,
  onScholarshipSelect,
  onFiltersChange,
  className
}: SearchResultsProps) {
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [processingStages, setProcessingStages] = useState<ProcessingStage[]>([])
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>(filters || {})
  const { reportError } = useError()

  // Search function
  const performSearch = useCallback(async (searchFilters: SearchFilters = {}) => {
    if (!profile) return

    setLoading(true)
    setError(null)
    setProcessingStages([
      { name: 'Searching', status: 'processing', progress: 0 },
      { name: 'Filtering', status: 'pending' },
      { name: 'Ranking', status: 'pending' },
      { name: 'AI Enhancement', status: 'pending' }
    ])

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profile,
          filters: searchFilters,
          limit: 25,
          offset: 0
        })
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setScholarships(data.data.scholarships)
        setTotal(data.data.total)
        
        // Update processing stages to complete
        setProcessingStages([
          { name: 'Searching', status: 'complete', progress: 100 },
          { name: 'Filtering', status: 'complete', progress: 100 },
          { name: 'Ranking', status: 'complete', progress: 100 },
          { name: 'AI Enhancement', status: data.data.aiEnhanced ? 'complete' : 'pending', progress: data.data.aiEnhanced ? 100 : 0 }
        ])
      } else {
        throw new Error(data.error || 'Search failed')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed'
      setError(errorMessage)
      setProcessingStages(prev => prev.map(stage => ({ ...stage, status: 'error' as const })))
      
      // Report error to global error handler
      reportError(err instanceof Error ? err : new Error(errorMessage), {
        component: 'SearchResults',
        action: 'performSearch',
        profile,
        filters: searchFilters
      })
    } finally {
      setLoading(false)
    }
  }, [profile, reportError])

  // Initial search
  useEffect(() => {
    if (profile) {
      performSearch(currentFilters)
    }
  }, [profile, performSearch])

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: SearchFilters) => {
    setCurrentFilters(newFilters)
    onFiltersChange?.(newFilters)
    performSearch(newFilters)
  }, [onFiltersChange, performSearch])

  // Memoize current filters to prevent unnecessary re-renders
  const memoizedCurrentFilters = useMemo(() => currentFilters, [currentFilters])
  
  // Memoize processing stages to prevent unnecessary re-renders
  const memoizedProcessingStages = useMemo(() => processingStages, [processingStages])

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Processing stages */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Finding your perfect scholarships...
          </h3>
          <div className="space-y-3">
            {processingStages.map((stage, index) => (
              <div key={stage.name} className="flex items-center space-x-3">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                  stage.status === 'complete' && 'bg-success text-white',
                  stage.status === 'processing' && 'bg-primary text-white animate-pulse',
                  stage.status === 'pending' && 'bg-white/10 text-white/60',
                  stage.status === 'error' && 'bg-error text-white'
                )}>
                  {stage.status === 'complete' ? '✓' : index + 1}
                </div>
                <div className="flex-1">
                  <span className={cn(
                    'text-sm font-medium',
                    stage.status === 'complete' && 'text-success',
                    stage.status === 'processing' && 'text-primary',
                    stage.status === 'pending' && 'text-white/60',
                    stage.status === 'error' && 'text-error'
                  )}>
                    {stage.name}
                  </span>
                  {stage.status === 'processing' && stage.progress !== undefined && (
                    <Progress value={stage.progress} className="h-1 mt-1" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Loading skeletons */}
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('text-center py-12', className)}>
        <Card className="p-8 max-w-md mx-auto">
          <div className="text-error mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Search Failed</h3>
          <p className="text-white/60 mb-4">{error}</p>
          <Button onClick={() => performSearch(currentFilters)}>
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="search-results-container">
      <div className={cn('space-y-6', className)}>
      {/* Results summary */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {total} Scholarships Found
          </h2>
          <p className="text-white/60">
            Ranked by compatibility with your profile
          </p>
        </div>
        
        {/* Quick filters */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFilterChange({})}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Scholarship cards */}
      <div className="space-y-4">
        {scholarships.map((scholarship) => (
          <ScholarshipCard
            key={scholarship.id}
            scholarship={scholarship}
            onSelect={onScholarshipSelect}
          />
        ))}
      </div>

      {/* Load more */}
      {scholarships.length < total && (
        <div className="text-center">
          <Button variant="secondary" onClick={() => {
            // Load more logic would go here
          }}>
            Load More Results
          </Button>
        </div>
      )}

      {/* Empty state */}
      {scholarships.length === 0 && !loading && (
        <div className="text-center py-12">
          <Card className="p-8 max-w-md mx-auto">
            <div className="text-white/40 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Scholarships Found</h3>
            <p className="text-white/60 mb-4">
              Try adjusting your filters or profile information to find more opportunities.
            </p>
            <Button onClick={() => handleFilterChange({})}>
              Clear All Filters
            </Button>
          </Card>
        </div>
      )}
      </div>
    </div>
  )
}

// Memoize the main component to prevent unnecessary re-renders
export default memo(SearchResults)