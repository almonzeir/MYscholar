// Advanced search engine with multiple data sources and AI integration
// Combines Google Search, database queries, and AI ranking for optimal results

import { GoogleScholarshipSearchService } from './googleSearch'
import { GeminiAIService } from './geminiAI'
import { ScholarshipIngestionService } from './dataIngestion'
import { cache, cacheKeys } from '../cache/redis'
import { logger } from '../utils/logger'
import type { Scholarship } from '../../types/database'

interface SearchOptions {
  profile: {
    nationality: string
    degreeTarget: string
    fieldKeywords: string[]
    specialStatus?: string[]
    gpa?: number
    languageTests?: Record<string, any>
    publications?: number
    workExperience?: number
  }
  filters?: {
    countries?: string[]
    degreeLevels?: string[]
    fields?: string[]
    deadlineBefore?: Date
    deadlineAfter?: Date
    minStipend?: number
    domains?: string[]
    search?: string
  }
  useAI?: boolean
  sources?: ('database' | 'google' | 'live')[]
  limit?: number
  offset?: number
}

interface EnhancedScholarship extends Scholarship {
  matchScore: number
  matchReasons: string[]
  llmRationale?: string
  applicationTips?: string[]
  potentialConcerns?: string[]
  searchSource: 'database' | 'google' | 'live'
  freshness: 'cached' | 'fresh' | 'stale'
}

interface SearchResult {
  scholarships: EnhancedScholarship[]
  total: number
  processingTime: number
  sources: {
    database: number
    google: number
    live: number
  }
  aiEnhanced: boolean
  cacheHit: boolean
}

export class AdvancedSearchEngine {
  private googleSearch: GoogleScholarshipSearchService
  private geminiAI: GeminiAIService
  private ingestionService: ScholarshipIngestionService

  constructor() {
    this.googleSearch = new GoogleScholarshipSearchService()
    this.geminiAI = new GeminiAIService()
    this.ingestionService = new ScholarshipIngestionService()
  }

  async search(options: SearchOptions): Promise<SearchResult> {
    const startTime = Date.now()
    const sources = options.sources || ['database', 'google']
    const useAI = options.useAI !== false // Default to true
    
    // Generate cache key
    const cacheKey = this.generateSearchCacheKey(options)
    
    // Check cache first
    const cachedResult = await cache.get<SearchResult>(cacheKey)
    if (cachedResult && this.isCacheValid(cachedResult)) {
      return {
        ...cachedResult,
        processingTime: Date.now() - startTime,
        cacheHit: true
      }
    }

    const allScholarships: EnhancedScholarship[] = []
    const sourceStats = { database: 0, google: 0, live: 0 }

    // Search from multiple sources
    for (const source of sources) {
      try {
        const scholarships = await this.searchFromSource(source, options)
        allScholarships.push(...scholarships)
        sourceStats[source] = scholarships.length
      } catch (error) {
        logger.error(`Search failed for source ${source}`, error instanceof Error ? error : new Error(String(error)))
      }
    }

    // Remove duplicates based on URL
    const uniqueScholarships = this.deduplicateScholarships(allScholarships)

    // Apply filters
    const filteredScholarships = this.applyFilters(uniqueScholarships, options.filters)

    // Calculate basic match scores
    const scoredScholarships = this.calculateMatchScores(filteredScholarships, options.profile)

    // Apply AI ranking if enabled
    let finalScholarships = scoredScholarships
    let aiEnhanced = false

    if (useAI && scoredScholarships.length > 0) {
      try {
        const topCandidates = scoredScholarships
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, Math.min(20, scoredScholarships.length))

        const aiRankings = await this.geminiAI.rankScholarships(
          options.profile,
          topCandidates,
          Math.min(options.limit || 25, topCandidates.length)
        )

        // Merge AI rankings
        finalScholarships = this.mergeAIRankings(scoredScholarships, aiRankings)
        aiEnhanced = true

      } catch (error) {
        console.warn('AI ranking failed, using basic ranking:', error)
      }
    }

    // Sort and paginate
    const sortedScholarships = finalScholarships.sort((a, b) => b.matchScore - a.matchScore)
    const paginatedScholarships = sortedScholarships.slice(
      options.offset || 0,
      (options.offset || 0) + (options.limit || 25)
    )

    const result: SearchResult = {
      scholarships: paginatedScholarships,
      total: sortedScholarships.length,
      processingTime: Date.now() - startTime,
      sources: sourceStats,
      aiEnhanced,
      cacheHit: false
    }

    // Cache the result
    await cache.set(cacheKey, result, { ttl: 600 }) // 10 minutes

    return result
  }

  private async searchFromSource(
    source: 'database' | 'google' | 'live',
    options: SearchOptions
  ): Promise<EnhancedScholarship[]> {
    switch (source) {
      case 'database':
        return this.searchDatabase(options)
      
      case 'google':
        return this.searchGoogle(options)
      
      case 'live':
        return this.searchLive(options)
      
      default:
        return []
    }
  }

  private async searchDatabase(options: SearchOptions): Promise<EnhancedScholarship[]> {
    // In a real implementation, this would query the database
    // For now, return mock data
    const mockScholarships: Scholarship[] = [
      {
        id: '1',
        name: 'DAAD Graduate School Scholarship',
        sourceUrl: 'https://www.daad.de/en/study-and-research-in-germany/scholarships/',
        domain: 'daad.de',
        country: 'Germany',
        degreeLevels: ['master', 'phd'],
        fields: ['computer science', 'engineering', 'natural sciences'],
        deadline: new Date('2024-10-31'),
        stipend: 1200,
        tuitionCovered: true,
        travelSupport: true,
        eligibilityText: 'Open to international students with excellent academic records',
        requirements: ['Bachelor degree', 'English proficiency', 'Research proposal'],
        tags: ['fully-funded', 'international', 'research'],
        confidence: 0.95,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    return mockScholarships.map(scholarship => ({
      ...scholarship,
      matchScore: 0, // Will be calculated later
      matchReasons: [],
      searchSource: 'database' as const,
      freshness: 'cached' as const
    }))
  }

  private async searchGoogle(options: SearchOptions): Promise<EnhancedScholarship[]> {
    try {
      const searchResults = await this.googleSearch.findScholarships({
        degreeLevel: options.profile.degreeTarget,
        field: options.profile.fieldKeywords[0],
        country: options.filters?.countries?.[0],
        limit: 20
      })

      // Convert Google results to scholarships (simplified)
      return searchResults.map((result, index) => ({
        id: `google_${index}`,
        name: result.title,
        sourceUrl: result.link,
        domain: result.displayLink,
        country: this.extractCountryFromDomain(result.displayLink),
        degreeLevels: [options.profile.degreeTarget],
        fields: options.profile.fieldKeywords,
        deadline: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000), // 6 months from now
        stipend: undefined,
        tuitionCovered: result.snippet.toLowerCase().includes('tuition'),
        travelSupport: result.snippet.toLowerCase().includes('travel'),
        eligibilityText: result.snippet,
        requirements: ['Check official website'],
        tags: ['google-search'],
        confidence: 0.7,
        createdAt: new Date(),
        updatedAt: new Date(),
        matchScore: 0,
        matchReasons: [],
        searchSource: 'google' as const,
        freshness: 'fresh' as const
      }))

    } catch (error) {
      logger.error('Google search failed', error instanceof Error ? error : new Error(String(error)))
      return []
    }
  }

  private async searchLive(options: SearchOptions): Promise<EnhancedScholarship[]> {
    try {
      // Trigger live ingestion for fresh data
      const ingestionResults = await this.ingestionService.ingestScholarships({
        sources: ['google'],
        degreeLevel: options.profile.degreeTarget,
        field: options.profile.fieldKeywords[0],
        limit: 10
      })

      // Return newly ingested scholarships (mock implementation)
      return []

    } catch (error) {
      logger.error('Live search failed', error instanceof Error ? error : new Error(String(error)))
      return []
    }
  }

  private deduplicateScholarships(scholarships: EnhancedScholarship[]): EnhancedScholarship[] {
    const seen = new Set<string>()
    return scholarships.filter(scholarship => {
      const key = scholarship.sourceUrl.toLowerCase()
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  private applyFilters(
    scholarships: EnhancedScholarship[],
    filters?: SearchOptions['filters']
  ): EnhancedScholarship[] {
    if (!filters) return scholarships

    return scholarships.filter(scholarship => {
      // Country filter
      if (filters.countries?.length && !filters.countries.includes(scholarship.country)) {
        return false
      }

      // Degree level filter
      if (filters.degreeLevels?.length && 
          !scholarship.degreeLevels.some(level => filters.degreeLevels!.includes(level))) {
        return false
      }

      // Field filter
      if (filters.fields?.length &&
          !scholarship.fields.some(field => 
            filters.fields!.some(filterField => 
              field.toLowerCase().includes(filterField.toLowerCase())
            )
          )) {
        return false
      }

      // Deadline filters
      if (filters.deadlineBefore && scholarship.deadline > filters.deadlineBefore) {
        return false
      }

      if (filters.deadlineAfter && scholarship.deadline < filters.deadlineAfter) {
        return false
      }

      // Stipend filter
      if (filters.minStipend && (!scholarship.stipend || scholarship.stipend < filters.minStipend)) {
        return false
      }

      // Domain filter
      if (filters.domains?.length && !filters.domains.includes(scholarship.domain)) {
        return false
      }

      // Text search
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const searchableText = [
          scholarship.name,
          scholarship.eligibilityText,
          ...scholarship.fields,
          ...scholarship.requirements
        ].join(' ').toLowerCase()

        if (!searchableText.includes(searchTerm)) {
          return false
        }
      }

      return true
    })
  }

  private calculateMatchScores(
    scholarships: EnhancedScholarship[],
    profile: SearchOptions['profile']
  ): EnhancedScholarship[] {
    return scholarships.map(scholarship => {
      let score = 0
      const reasons: string[] = []

      // Degree level match (30% weight)
      if (scholarship.degreeLevels.includes(profile.degreeTarget)) {
        score += 30
        reasons.push(`Matches your target degree: ${profile.degreeTarget}`)
      }

      // Field keywords match (25% weight)
      const fieldMatches = profile.fieldKeywords.filter(keyword =>
        scholarship.fields.some(field =>
          field.toLowerCase().includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(field.toLowerCase())
        )
      )
      if (fieldMatches.length > 0) {
        const fieldScore = Math.min(25, (fieldMatches.length / profile.fieldKeywords.length) * 25)
        score += fieldScore
        reasons.push(`Field match: ${fieldMatches.join(', ')}`)
      }

      // Deadline proximity (20% weight)
      const now = new Date()
      const daysUntilDeadline = Math.ceil((scholarship.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysUntilDeadline > 0) {
        if (daysUntilDeadline > 30) {
          score += 20
          reasons.push('Plenty of time to apply')
        } else if (daysUntilDeadline > 7) {
          score += 15
          reasons.push('Application deadline approaching')
        } else {
          score += 5
          reasons.push('Urgent: Deadline very soon')
        }
      }

      // Financial support (15% weight)
      if (scholarship.tuitionCovered) {
        score += 10
        reasons.push('Tuition covered')
      }
      if (scholarship.stipend && scholarship.stipend > 1000) {
        score += 5
        reasons.push(`Good stipend: €${scholarship.stipend}/month`)
      }

      // Academic qualifications (10% weight)
      if (profile.gpa && profile.gpa >= 3.5) {
        score += 5
        reasons.push('Strong GPA qualifies for competitive scholarships')
      }
      if (profile.publications && profile.publications > 0) {
        score += 5
        reasons.push('Research experience is valuable')
      }

      return {
        ...scholarship,
        matchScore: Math.min(100, score),
        matchReasons: reasons
      }
    })
  }

  private mergeAIRankings(
    scholarships: EnhancedScholarship[],
    aiRankings: any[]
  ): EnhancedScholarship[] {
    return scholarships.map(scholarship => {
      const aiRanking = aiRankings.find(r => r.scholarshipId === scholarship.id)
      if (aiRanking) {
        return {
          ...scholarship,
          matchScore: aiRanking.enhancedScore,
          matchReasons: aiRanking.matchStrengths,
          llmRationale: aiRanking.aiRationale,
          applicationTips: aiRanking.applicationTips,
          potentialConcerns: aiRanking.potentialConcerns
        }
      }
      return scholarship
    })
  }

  private generateSearchCacheKey(options: SearchOptions): string {
    const cacheData = {
      profile: {
        nationality: options.profile.nationality,
        degreeTarget: options.profile.degreeTarget,
        fieldKeywords: options.profile.fieldKeywords.sort()
      },
      filters: options.filters || {},
      sources: options.sources?.sort() || ['database'],
      useAI: options.useAI !== false
    }
    return Buffer.from(JSON.stringify(cacheData)).toString('base64')
  }

  private isCacheValid(cachedResult: SearchResult): boolean {
    // Cache is valid for 10 minutes for fresh results
    // For database results, cache longer
    const maxAge = cachedResult.sources.google > 0 ? 10 * 60 * 1000 : 30 * 60 * 1000
    return Date.now() - cachedResult.processingTime < maxAge
  }

  private extractCountryFromDomain(domain: string): string {
    const countryMap: Record<string, string> = {
      'daad.de': 'Germany',
      'studyinnorway.no': 'Norway',
      'studyinsweden.se': 'Sweden',
      'studyindenmark.dk': 'Denmark',
      'nuffic.nl': 'Netherlands',
      'campusfrance.org': 'France',
      'britishcouncil.org': 'United Kingdom'
    }

    return countryMap[domain] || 'International'
  }
}