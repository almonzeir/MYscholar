import React from 'react'
import { Scholarship } from '@/types/database'
import Card from '@/components/ui/Card'
import { SkeletonCard } from '@/components/ui/Skeleton'
import Chip from '@/components/ui/Chip'
import Button from '@/components/ui/Button'

interface SearchResultsProps {
  results: Scholarship[]
  loading: boolean
}

export function SearchResults({ results, loading }: SearchResultsProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Searching for scholarships...</h3>
          <p className="text-white/70">This may take a few moments</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 glass-card">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-white mb-2">No scholarships found</h3>
        <p className="text-white/70 mb-4">
          Try adjusting your search criteria or removing some filters
        </p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Reset Search
        </Button>
      </div>
    )
  }

  const formatDeadline = (deadline: Date | string) => {
    if (deadline === 'varies') return 'Varies'
    const date = new Date(deadline)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const copyAllResults = () => {
    const summary = results.map((sch, index) => 
      `${index + 1}. ${sch.name}\n   ${sch.sourceUrl}\n   Deadline: ${formatDeadline(sch.deadline)}\n`
    ).join('\n')
    
    navigator.clipboard.writeText(summary)
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between glass-card p-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Found {results.length} scholarship{results.length !== 1 ? 's' : ''}
          </h3>
          <p className="text-white/70 text-sm">
            Sorted by relevance to your profile
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={copyAllResults}>
          📋 Copy All
        </Button>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((scholarship) => (
          <Card 
            key={scholarship.id} 
            variant="glass-hover"
            className="flex flex-col h-full p-6 transition-all duration-300"
          >
            {/* Header */}
            <div className="mb-4">
              <h4 className="text-lg font-bold text-white mb-2 line-clamp-2">
                {scholarship.name}
              </h4>
              <div className="flex items-center text-white/60 text-sm">
                <span>{scholarship.domain}</span>
                {scholarship.country && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{scholarship.country}</span>
                  </>
                )}
              </div>
            </div>

            {/* Degree Levels */}
            <div className="flex flex-wrap gap-2 mb-3">
              {scholarship.degreeLevels.map((level) => (
                <Chip key={level} variant="primary" size="sm">
                  {level}
                </Chip>
              ))}
            </div>

            {/* Fields */}
            <div className="flex flex-wrap gap-2 mb-4">
              {scholarship.fields.slice(0, 3).map((field) => (
                <Chip key={field} variant="default" size="sm">
                  {field}
                </Chip>
              ))}
              {scholarship.fields.length > 3 && (
                <Chip variant="default" size="sm">
                  +{scholarship.fields.length - 3} more
                </Chip>
              )}
            </div>

            {/* Funding Information */}
            <div className="flex flex-wrap gap-2 mb-4">
              {scholarship.tuitionCovered && (
                <Chip variant="success" size="sm">💰 Tuition</Chip>
              )}
              {scholarship.stipend && (
                <Chip variant="success" size="sm">💵 Stipend</Chip>
              )}
              {scholarship.travelSupport && (
                <Chip variant="success" size="sm">✈️ Travel</Chip>
              )}
            </div>

            {/* Deadline */}
            <div className="text-sm text-white/70 mb-4">
              <span className="font-medium">Deadline:</span> {formatDeadline(scholarship.deadline)}
            </div>

            {/* Action Button */}
            <div className="mt-auto">
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => window.open(scholarship.sourceUrl, '_blank')}
              >
                View Details →
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Summary Section */}
      {results.length > 0 && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Quick Summary</h4>
          <div className="space-y-2 text-sm text-white/80 max-h-40 overflow-y-auto scrollbar-thin">
            {results.map((sch, index) => (
              <div key={sch.id} className="flex justify-between items-start gap-4">
                <span className="flex-1">
                  {index + 1}. {sch.name}
                </span>
                <span className="text-white/60 text-xs whitespace-nowrap">
                  {formatDeadline(sch.deadline)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}