// Data ingestion service for scholarship information
// Handles collection, normalization, and storage of scholarship data

import { GoogleScholarshipSearchService } from './googleSearch'
import { logger } from '../utils/logger'
// import type { Scholarship } from '../../types/database'

interface RawScholarshipData {
  title: string
  url: string
  content: string
  domain: string
  extractedAt: Date
  source: 'google_search' | 'rss' | 'manual'
}

interface NormalizedScholarshipData {
  name: string
  sourceUrl: string
  domain: string
  country: string
  degreeLevels: string[]
  fields: string[]
  deadline: Date
  stipend?: number
  tuitionCovered: boolean
  travelSupport: boolean
  eligibilityText: string
  requirements: string[]
  tags: string[]
  confidence: number
}

export class ScholarshipIngestionService {
  private googleSearch: GoogleScholarshipSearchService

  constructor() {
    this.googleSearch = new GoogleScholarshipSearchService()
  }

  // Main ingestion pipeline
  async ingestScholarships(options: {
    sources?: ('google' | 'rss' | 'manual')[]
    degreeLevel?: string
    field?: string
    country?: string
    limit?: number
  } = {}): Promise<{
    processed: number
    successful: number
    failed: number
    errors: string[]
  }> {
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    }

    const sources = options.sources || ['google']

    for (const source of sources) {
      try {
        switch (source) {
          case 'google':
            await this.ingestFromGoogle(options, results)
            break
          case 'rss':
            await this.ingestFromRSS(options, results)
            break
          case 'manual':
            await this.ingestManualSources(options, results)
            break
        }
      } catch (error) {
        results.errors.push(`${source} ingestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return results
  }

  private async ingestFromGoogle(
    options: any,
    results: { processed: number; successful: number; failed: number; errors: string[] }
  ): Promise<void> {
    try {
      const searchResults = await this.googleSearch.findScholarships({
        degreeLevel: options.degreeLevel,
        field: options.field,
        country: options.country,
        limit: options.limit || 50
      })

      for (const result of searchResults) {
        results.processed++

        try {
          // Extract content from the page
          const rawData: RawScholarshipData = {
            title: result.title,
            url: result.link,
            content: result.snippet || '',
            domain: result.displayLink,
            extractedAt: new Date(),
            source: 'google_search'
          }

          // Normalize the data
          const normalized = await this.normalizeScholarshipData(rawData)
          
          if (normalized) {
            // In a real implementation, save to database
            // await scholarshipRepository.create(normalized)
            results.successful++
          } else {
            results.failed++
            results.errors.push(`Failed to normalize: ${result.title}`)
          }

        } catch (error) {
          results.failed++
          results.errors.push(`Processing failed for ${result.title}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
      }

    } catch (error) {
      throw new Error(`Google ingestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async ingestFromRSS(
    _options: any,
    results: { processed: number; successful: number; failed: number; errors: string[] }
  ): Promise<void> {
    // RSS feed sources for scholarship announcements
    const rssSources = [
      'https://www.daad.de/en/rss.xml',
      'https://www.fulbrightonline.org/rss',
      'https://www.chevening.org/rss',
      // Add more RSS feeds
    ]

    for (const rssUrl of rssSources) {
      try {
        // In a real implementation, parse RSS feeds
        // const feed = await parseFeed(rssUrl)
        // Process feed items...
        
        results.processed += 5 // Mock processing
        results.successful += 4
        results.failed += 1

      } catch (error) {
        results.errors.push(`RSS ingestion failed for ${rssUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  private async ingestManualSources(
    _options: any,
    results: { processed: number; successful: number; failed: number; errors: string[] }
  ): Promise<void> {
    // Manual curation of high-quality scholarship sources
    const manualSources = [
      {
        name: 'DAAD Scholarships Database',
        url: 'https://www.daad.de/en/study-and-research-in-germany/scholarships/',
        scrapeConfig: {
          titleSelector: '.scholarship-title',
          deadlineSelector: '.deadline',
          descriptionSelector: '.description'
        }
      },
      // Add more manual sources
    ]

    for (const source of manualSources) {
      try {
        // In a real implementation, scrape structured data
        // const scrapedData = await scrapeWebsite(source)
        // Process scraped data...
        
        results.processed += 10 // Mock processing
        results.successful += 9
        results.failed += 1

      } catch (error) {
        results.errors.push(`Manual ingestion failed for ${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  // Normalize raw scholarship data into structured format
  private async normalizeScholarshipData(raw: RawScholarshipData): Promise<NormalizedScholarshipData | null> {
    try {
      // Extract structured information from raw content
      const normalized: NormalizedScholarshipData = {
        name: this.cleanTitle(raw.title),
        sourceUrl: raw.url,
        domain: raw.domain,
        country: this.extractCountry(raw.content, raw.domain),
        degreeLevels: this.extractDegreeLevels(raw.content),
        fields: this.extractFields(raw.content),
        deadline: this.extractDeadline(raw.content),
        stipend: this.extractStipend(raw.content),
        tuitionCovered: this.extractTuitionInfo(raw.content),
        travelSupport: this.extractTravelInfo(raw.content),
        eligibilityText: this.extractEligibility(raw.content),
        requirements: this.extractRequirements(raw.content),
        tags: this.generateTags(raw.content, raw.domain),
        confidence: this.calculateConfidence(raw)
      }

      // Validate the normalized data
      if (this.validateScholarshipData(normalized)) {
        return normalized
      }

      return null

    } catch (error) {
      logger.error('Data normalization failed', error instanceof Error ? error : new Error(String(error)))
      return null
    }
  }

  // Data extraction methods
  private cleanTitle(title: string): string {
    return title
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .substring(0, 200)
  }

  private extractCountry(content: string, domain: string): string {
    // Domain-based country mapping
    const domainCountryMap: Record<string, string> = {
      'daad.de': 'Germany',
      'studyinnorway.no': 'Norway',
      'studyinsweden.se': 'Sweden',
      'studyindenmark.dk': 'Denmark',
      'nuffic.nl': 'Netherlands',
      'campusfrance.org': 'France',
      'britishcouncil.org': 'United Kingdom'
    }

    if (domainCountryMap[domain]) {
      return domainCountryMap[domain]
    }

    // Content-based extraction
    const countryPatterns = [
      /study in (\w+)/i,
      /scholarships? (?:for|in) (\w+)/i,
      /(\w+) government scholarship/i
    ]

    for (const pattern of countryPatterns) {
      const match = content.match(pattern)
      if (match) {
        return this.capitalizeCountry(match[1])
      }
    }

    return 'International'
  }

  private extractDegreeLevels(content: string): string[] {
    const levels: string[] = []
    const lowerContent = content.toLowerCase()

    if (lowerContent.includes('bachelor') || lowerContent.includes('undergraduate')) {
      levels.push('bachelor')
    }
    if (lowerContent.includes('master') || lowerContent.includes('graduate')) {
      levels.push('master')
    }
    if (lowerContent.includes('phd') || lowerContent.includes('doctoral') || lowerContent.includes('doctorate')) {
      levels.push('phd')
    }
    if (lowerContent.includes('postdoc') || lowerContent.includes('post-doctoral')) {
      levels.push('postdoc')
    }

    return levels.length > 0 ? levels : ['master'] // Default to master's
  }

  private extractFields(content: string): string[] {
    const fieldKeywords = [
      'computer science', 'engineering', 'medicine', 'business', 'economics',
      'law', 'arts', 'humanities', 'social sciences', 'natural sciences',
      'mathematics', 'physics', 'chemistry', 'biology', 'psychology',
      'education', 'journalism', 'architecture', 'design', 'music'
    ]

    const lowerContent = content.toLowerCase()
    const foundFields = fieldKeywords.filter(field => 
      lowerContent.includes(field)
    )

    return foundFields.length > 0 ? foundFields : ['all fields']
  }

  private extractDeadline(content: string): Date {
    // Common deadline patterns
    const deadlinePatterns = [
      /deadline:?\s*(\w+\s+\d{1,2},?\s+\d{4})/i,
      /apply by:?\s*(\w+\s+\d{1,2},?\s+\d{4})/i,
      /due:?\s*(\w+\s+\d{1,2},?\s+\d{4})/i,
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
      /(\d{4}-\d{2}-\d{2})/
    ]

    for (const pattern of deadlinePatterns) {
      const match = content.match(pattern)
      if (match) {
        const date = new Date(match[1])
        if (!isNaN(date.getTime()) && date > new Date()) {
          return date
        }
      }
    }

    // Default to 6 months from now if no deadline found
    const defaultDeadline = new Date()
    defaultDeadline.setMonth(defaultDeadline.getMonth() + 6)
    return defaultDeadline
  }

  private extractStipend(content: string): number | undefined {
    const stipendPatterns = [
      /€(\d{1,3}(?:,\d{3})*)/,
      /\$(\d{1,3}(?:,\d{3})*)/,
      /(\d{1,3}(?:,\d{3})*)\s*(?:euro|eur|dollar|usd)/i
    ]

    for (const pattern of stipendPatterns) {
      const match = content.match(pattern)
      if (match) {
        const amount = parseInt(match[1].replace(/,/g, ''))
        if (amount > 100 && amount < 10000) { // Reasonable monthly stipend range
          return amount
        }
      }
    }

    return undefined
  }

  private extractTuitionInfo(content: string): boolean {
    const tuitionKeywords = ['tuition covered', 'tuition free', 'no tuition', 'tuition waiver', 'full funding']
    const lowerContent = content.toLowerCase()
    return tuitionKeywords.some(keyword => lowerContent.includes(keyword))
  }

  private extractTravelInfo(content: string): boolean {
    const travelKeywords = ['travel allowance', 'flight', 'airfare', 'travel support', 'transportation']
    const lowerContent = content.toLowerCase()
    return travelKeywords.some(keyword => lowerContent.includes(keyword))
  }

  private extractEligibility(content: string): string {
    // Extract the first sentence or paragraph that mentions eligibility
    const eligibilityPatterns = [
      /eligibility:?\s*([^.]+\.)/i,
      /eligible:?\s*([^.]+\.)/i,
      /requirements:?\s*([^.]+\.)/i
    ]

    for (const pattern of eligibilityPatterns) {
      const match = content.match(pattern)
      if (match) {
        return match[1].trim()
      }
    }

    return content.substring(0, 200) + '...'
  }

  private extractRequirements(content: string): string[] {
    const commonRequirements = [
      'bachelor degree', 'master degree', 'english proficiency', 'gpa requirement',
      'research proposal', 'letters of recommendation', 'personal statement',
      'cv', 'transcript', 'language test'
    ]

    const lowerContent = content.toLowerCase()
    return commonRequirements.filter(req => lowerContent.includes(req))
  }

  private generateTags(content: string, domain: string): string[] {
    const tags: string[] = []
    const lowerContent = content.toLowerCase()

    // Funding type tags
    if (lowerContent.includes('full') && (lowerContent.includes('fund') || lowerContent.includes('scholarship'))) {
      tags.push('fully-funded')
    }
    if (lowerContent.includes('partial')) {
      tags.push('partial-funding')
    }

    // Prestige tags
    if (['daad.de', 'fulbrightonline.org', 'chevening.org'].includes(domain)) {
      tags.push('prestigious')
    }

    // Type tags
    if (lowerContent.includes('research')) {
      tags.push('research')
    }
    if (lowerContent.includes('international')) {
      tags.push('international')
    }

    return tags
  }

  private calculateConfidence(raw: RawScholarshipData): number {
    let confidence = 0.5 // Base confidence

    // Domain trust score
    const trustedDomains = ['daad.de', 'fulbrightonline.org', 'chevening.org', 'commonwealthscholarships.org']
    if (trustedDomains.includes(raw.domain)) {
      confidence += 0.3
    }

    // Content quality score
    if (raw.content.length > 100) {
      confidence += 0.1
    }
    if (raw.content.includes('deadline') || raw.content.includes('apply')) {
      confidence += 0.1
    }

    return Math.min(confidence, 1.0)
  }

  private validateScholarshipData(data: NormalizedScholarshipData): boolean {
    return !!(
      data.name &&
      data.sourceUrl &&
      data.domain &&
      data.country &&
      data.degreeLevels.length > 0 &&
      data.deadline &&
      data.deadline > new Date()
    )
  }

  private capitalizeCountry(country: string): string {
    return country.charAt(0).toUpperCase() + country.slice(1).toLowerCase()
  }
}