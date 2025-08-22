'use client'

import React, { useState, useEffect } from 'react'
import { ProfileInputForm } from './ProfileInputForm'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import ProfilePills from '@/components/ui/ProfilePills'
import { SearchResults } from './SearchResults'
import { Scholarship } from '@/types/database'
import { UserProfile } from '@/types/profile'

export function SearchApp() {
  const [query, setQuery] = useState('')
  const [profile, setProfile] = useState<UserProfile>({
    degreeTarget: '',
    fields: [],
    nationality: '',
    currentCountryOfResidence: '',
    languageProofs: [],
    gpaBand: '',
    graduationYear: '',
    workResearchYears: '',
    specialStatuses: [],
    deadlineWindow: 'Any',
  })
  const [results, setResults] = useState<Scholarship[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)
  const limit = 25

  const handleProfileChange = (newProfile: UserProfile) => {
    setProfile(newProfile)
  }

  const handleSearch = async () => {
    setLoading(true)
    setResults([])
    setTotal(0)
    setHasSearched(true)

    try {
      const queryParams = new URLSearchParams()
      queryParams.append('q', query)
      queryParams.append('profile', JSON.stringify(profile))
      queryParams.append('limit', limit.toString())
      queryParams.append('offset', offset.toString())

      const response = await fetch(`/api/search?${queryParams.toString()}`)
      const data = await response.json()
      setResults(data.scholarships || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Error fetching search results:', error)
      // Mock data for development
      setResults([
        {
          id: '1',
          name: 'Global Excellence Scholarship',
          sourceUrl: 'https://example.com/scholarship1',
          domain: 'University of Excellence',
          country: 'Canada',
          degreeLevels: ['Master', 'PhD'],
          fields: ['Computer Science', 'Engineering'],
          deadline: new Date('2024-12-31'),
          tuitionCovered: true,
          stipend: 25000,
          travelSupport: true,
          eligibilityText: 'Open to international students',
          requirements: ['GPA >= 3.5', 'IELTS 7.0'],
          tags: ['STEM', 'International'],
          confidence: 0.95,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ])
      setTotal(1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hasSearched) {
      handleSearch()
    }
  }, [offset, profile]) // Add profile to dependency array

  return (
    <div className="space-y-8">
      {/* Profile Input Form */}
      <ProfileInputForm 
        profile={profile} // Pass profile state to ProfileInputForm
        onProfileChange={handleProfileChange} 
        onSearch={handleSearch} 
      />
      
      {/* Additional Search Input */}
      <div className="glass-card p-4">
        <div className="flex gap-3">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Additional keywords (optional)..."
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </div>
      
      {/* Additional Search Input */}
      <div className="glass-card p-4">
        <div className="flex gap-3">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Additional keywords (optional)..."
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </div>

      {/* Search Results */}
      {hasSearched && (
        <>
          <SearchResults results={results} loading={loading} />
          
          {/* Pagination */}
          {total > limit && (
            <div className="flex justify-center gap-4 mt-8">
              <Button 
                variant="secondary"
                onClick={() => setOffset(offset - limit)} 
                disabled={offset === 0 || loading}
              >
                ← Previous
              </Button>
              <span className="flex items-center text-white/70 px-4">
                {Math.floor(offset / limit) + 1} of {Math.ceil(total / limit)}
              </span>
              <Button 
                variant="secondary"
                onClick={() => setOffset(offset + limit)} 
                disabled={offset + limit >= total || loading}
              >
                Next →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}