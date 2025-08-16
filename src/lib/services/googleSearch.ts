// Google Programmable Search Engine integration
// This service handles scholarship data collection from trusted sources

import { logger } from '../utils/logger'

interface GoogleSearchResult {
  title: string
  link: string
  snippet: string
  displayLink: string
  formattedUrl: string
  htmlTitle?: string
  htmlSnippet?: string
}

interface GoogleSearchResponse {
  items?: GoogleSearchResult[]
  searchInformation?: {
    totalResults: string
    searchTime: number
  }
  queries?: {
    nextPage?: Array<{
      startIndex: number
    }>
  }
}

export class GoogleScholarshipSearchService {
  private apiKey: string
  private searchEngineId: string
  private baseUrl = 'https://www.googleapis.com/customsearch/v1'

  constructor() {
    this.apiKey = process.env.GOOGLE_SEARCH_API_KEY || ''
    this.searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || ''
    
    if (!this.apiKey || !this.searchEngineId) {
      console.warn('Google Search API credentials not configured')
    }
  }

  async searchScholarships(query: string, options: {
    start?: number
    num?: number
    siteRestrict?: string[]
    dateRestrict?: string
  } = {}): Promise<GoogleSearchResponse> {
    if (!this.apiKey || !this.searchEngineId) {
      throw new Error('Google Search API not configured')
    }

    const params = new URLSearchParams({
      key: this.apiKey,
      cx: this.searchEngineId,
      q: query,
      start: (options.start || 1).toString(),
      num: Math.min(options.num || 10, 10).toString(), // Max 10 per request
      safe: 'active',
      fields: 'items(title,link,snippet,displayLink,formattedUrl,htmlTitle,htmlSnippet),searchInformation,queries'
    })

    // Add site restrictions if provided
    if (options.siteRestrict?.length) {
      const siteQuery = options.siteRestrict.map(site => `site:${site}`).join(' OR ')
      params.set('q', `${query} (${siteQuery})`)
    }

    // Add date restrictions
    if (options.dateRestrict) {
      params.set('dateRestrict', options.dateRestrict)
    }

    try {
      const response = await fetch(`${this.baseUrl}?${params}`, {
        headers: {
          'User-Agent': 'ScholarshipPlatform/1.0'
        }
      })

      if (!response.ok) {
        throw new Error(`Google Search API error: ${response.status} ${response.statusText}`)
      }

      const data: GoogleSearchResponse = await response.json()
      return data

    } catch (error) {
      logger.error('Google Search API error', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  // Search for scholarships with predefined queries
  async findScholarships(options: {
    degreeLevel?: string
    field?: string
    country?: string
    year?: number
    limit?: number
  } = {}): Promise<GoogleSearchResult[]> {
    const queries = this.buildScholarshipQueries(options)
    const allResults: GoogleSearchResult[] = []

    for (const query of queries) {
      try {
        const response = await this.searchScholarships(query, {
          num: Math.min(options.limit || 10, 10),
          siteRestrict: this.getTrustedDomains(),
          dateRestrict: 'y1' // Last year
        })

        if (response.items) {
          allResults.push(...response.items)
        }

        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        logger.error('Google search query failed', error instanceof Error ? error : new Error(String(error)), { query })
        continue
      }
    }

    // Remove duplicates based on URL
    const uniqueResults = allResults.filter((result, index, self) =>
      index === self.findIndex(r => r.link === result.link)
    )

    return uniqueResults.slice(0, options.limit || 50)
  }

  private buildScholarshipQueries(options: {
    degreeLevel?: string
    field?: string
    country?: string
    year?: number
  }): string[] {
    const baseTerms = ['scholarship', 'fellowship', 'grant', 'funding']
    const year = options.year || new Date().getFullYear()
    
    const queries: string[] = []

    baseTerms.forEach(term => {
      let query = `${term} ${year}`
      
      if (options.degreeLevel) {
        query += ` ${options.degreeLevel}`
      }
      
      if (options.field) {
        query += ` "${options.field}"`
      }
      
      if (options.country) {
        query += ` ${options.country}`
      }

      // Add common scholarship terms
      query += ' application deadline requirements'
      
      queries.push(query)
    })

    return queries
  }

  private getTrustedDomains(): string[] {
    return [
      'daad.de',
      'fulbrightonline.org',
      'chevening.org',
      'commonwealthscholarships.org',
      'erasmusplus.org.uk',
      'europa.eu',
      'britishcouncil.org',
      'iie.org',
      'studyinnorway.no',
      'studyinsweden.se',
      'studyindenmark.dk',
      'nuffic.nl',
      'campusfrance.org',
      'scholarshipportal.com',
      'studyportals.com'
    ]
  }

  // Get search quota usage
  async getQuotaUsage(): Promise<{
    dailyQueries: number
    remainingQueries: number
    resetTime: Date
  }> {
    // This would typically come from Google Cloud Console or API
    // For now, return mock data
    return {
      dailyQueries: 85,
      remainingQueries: 15,
      resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  }
}