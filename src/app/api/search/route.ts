import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { cache, cacheKeys, cacheTags } from '../../../lib/cache/redis'
import { logger } from '../../../lib/utils/logger'
import type { Scholarship } from '../../../types/database'

// Search request schema
const SearchRequestSchema = z.object({
  profile: z.object({
    nationality: z.string(),
    degreeTarget: z.enum(['bachelor', 'master', 'phd', 'postdoc']),
    fieldKeywords: z.array(z.string()),
    specialStatus: z.array(z.string()).optional().default([]),
    gpa: z.number().optional(),
    languageTests: z.record(z.string(), z.any()).optional(),
    publications: z.number().optional(),
    workExperience: z.number().optional(),
    constraints: z.record(z.string(), z.any()).optional().default({})
  }),
  filters: z.object({
    countries: z.array(z.string()).optional(),
    degreeLevels: z.array(z.string()).optional(),
    fields: z.array(z.string()).optional(),
    deadlineBefore: z.string().datetime().optional(),
    deadlineAfter: z.string().datetime().optional(),
    minStipend: z.number().optional(),
    domains: z.array(z.string()).optional(),
    search: z.string().optional()
  }).optional(),
  limit: z.number().min(1).max(100).default(25),
  offset: z.number().min(0).default(0)
})

interface RankedScholarship extends Scholarship {
  matchScore: number
  matchReasons: string[]
  llmRationale?: string
}

// Mock scholarship data for demonstration
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
  },
  {
    id: '2',
    name: 'Fulbright Foreign Student Program',
    sourceUrl: 'https://foreign.fulbrightonline.org/',
    domain: 'fulbrightonline.org',
    country: 'United States',
    degreeLevels: ['master', 'phd'],
    fields: ['all fields'],
    deadline: new Date('2024-09-15'),
    stipend: 2000,
    tuitionCovered: true,
    travelSupport: true,
    eligibilityText: 'Open to citizens of participating countries',
    requirements: ['Bachelor degree', 'English proficiency', 'Leadership potential'],
    tags: ['prestigious', 'fully-funded', 'cultural-exchange'],
    confidence: 0.9,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Erasmus Mundus Joint Master Degrees',
    sourceUrl: 'https://ec.europa.eu/programmes/erasmus-plus/',
    domain: 'europa.eu',
    country: 'European Union',
    degreeLevels: ['master'],
    fields: ['computer science', 'data science', 'artificial intelligence'],
    deadline: new Date('2024-12-01'),
    stipend: 1400,
    tuitionCovered: true,
    travelSupport: true,
    eligibilityText: 'Open to students worldwide',
    requirements: ['Bachelor degree', 'English proficiency', 'Academic excellence'],
    tags: ['european', 'joint-degree', 'mobility'],
    confidence: 0.88,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    name: 'Chevening Scholarships',
    sourceUrl: 'https://www.chevening.org/',
    domain: 'chevening.org',
    country: 'United Kingdom',
    degreeLevels: ['master'],
    fields: ['all fields'],
    deadline: new Date('2024-11-02'),
    stipend: 1800,
    tuitionCovered: true,
    travelSupport: true,
    eligibilityText: 'Open to citizens of Chevening-eligible countries',
    requirements: ['Bachelor degree', 'English proficiency', 'Leadership experience'],
    tags: ['prestigious', 'fully-funded', 'leadership'],
    confidence: 0.92,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    name: 'Australia Awards Scholarships',
    sourceUrl: 'https://www.australiaawards.gov.au/',
    domain: 'australiaawards.gov.au',
    country: 'Australia',
    degreeLevels: ['bachelor', 'master', 'phd'],
    fields: ['all fields'],
    deadline: new Date('2024-04-30'),
    stipend: 1600,
    tuitionCovered: true,
    travelSupport: true,
    eligibilityText: 'Open to citizens of eligible developing countries',
    requirements: ['Academic excellence', 'English proficiency', 'Development focus'],
    tags: ['development', 'fully-funded', 'international'],
    confidence: 0.87,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '6',
    name: 'Swiss Government Excellence Scholarships',
    sourceUrl: 'https://www.sbfi.admin.ch/sbfi/en/home/education/scholarships-and-grants/swiss-government-excellence-scholarships.html',
    domain: 'admin.ch',
    country: 'Switzerland',
    degreeLevels: ['master', 'phd', 'postdoc'],
    fields: ['natural sciences', 'engineering', 'medicine', 'social sciences'],
    deadline: new Date('2024-12-15'),
    stipend: 1920,
    tuitionCovered: true,
    travelSupport: false,
    eligibilityText: 'Open to foreign scholars and artists',
    requirements: ['Academic excellence', 'Research proposal', 'Language proficiency'],
    tags: ['research', 'excellence', 'european'],
    confidence: 0.89,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '7',
    name: 'MEXT Scholarships (Japan)',
    sourceUrl: 'https://www.mext.go.jp/en/policy/education/highered/title02/detail02/sdetail02/1373897.htm',
    domain: 'mext.go.jp',
    country: 'Japan',
    degreeLevels: ['bachelor', 'master', 'phd'],
    fields: ['all fields'],
    deadline: new Date('2024-05-31'),
    stipend: 1100,
    tuitionCovered: true,
    travelSupport: true,
    eligibilityText: 'Open to international students',
    requirements: ['Academic excellence', 'Japanese language study', 'Health certificate'],
    tags: ['cultural-exchange', 'fully-funded', 'asia'],
    confidence: 0.85,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '8',
    name: 'Gates Cambridge Scholarships',
    sourceUrl: 'https://www.gatescambridge.org/',
    domain: 'gatescambridge.org',
    country: 'United Kingdom',
    degreeLevels: ['master', 'phd'],
    fields: ['all fields'],
    deadline: new Date('2024-12-04'),
    stipend: 2200,
    tuitionCovered: true,
    travelSupport: true,
    eligibilityText: 'Open to citizens of countries outside the UK',
    requirements: ['Outstanding academic achievement', 'Leadership potential', 'Commitment to improving lives'],
    tags: ['prestigious', 'fully-funded', 'leadership'],
    confidence: 0.96,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '9',
    name: 'Vanier Canada Graduate Scholarships',
    sourceUrl: 'https://vanier.gc.ca/',
    domain: 'gc.ca',
    country: 'Canada',
    degreeLevels: ['phd'],
    fields: ['health research', 'natural sciences', 'engineering', 'social sciences'],
    deadline: new Date('2024-11-01'),
    stipend: 4167,
    tuitionCovered: false,
    travelSupport: false,
    eligibilityText: 'Open to Canadian and international students',
    requirements: ['Academic excellence', 'Research potential', 'Leadership'],
    tags: ['prestigious', 'research', 'high-value'],
    confidence: 0.93,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '10',
    name: 'Chinese Government Scholarship',
    sourceUrl: 'http://www.csc.edu.cn/',
    domain: 'csc.edu.cn',
    country: 'China',
    degreeLevels: ['bachelor', 'master', 'phd'],
    fields: ['all fields'],
    deadline: new Date('2024-04-30'),
    stipend: 800,
    tuitionCovered: true,
    travelSupport: true,
    eligibilityText: 'Open to international students',
    requirements: ['Academic excellence', 'Health certificate', 'Age requirements'],
    tags: ['fully-funded', 'international', 'asia'],
    confidence: 0.82,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '11',
    name: 'Rhodes Scholarships',
    sourceUrl: 'https://www.rhodeshouse.ox.ac.uk/',
    domain: 'rhodeshouse.ox.ac.uk',
    country: 'United Kingdom',
    degreeLevels: ['master', 'phd'],
    fields: ['all fields'],
    deadline: new Date('2024-10-01'),
    stipend: 2000,
    tuitionCovered: true,
    travelSupport: true,
    eligibilityText: 'Open to citizens of eligible countries',
    requirements: ['Academic excellence', 'Leadership', 'Service to others'],
    tags: ['prestigious', 'fully-funded', 'oxford'],
    confidence: 0.98,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '12',
    name: 'Eiffel Excellence Scholarship',
    sourceUrl: 'https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence',
    domain: 'campusfrance.org',
    country: 'France',
    degreeLevels: ['master', 'phd'],
    fields: ['engineering', 'economics', 'management', 'political science', 'law'],
    deadline: new Date('2024-01-08'),
    stipend: 1181,
    tuitionCovered: true,
    travelSupport: true,
    eligibilityText: 'Open to international students from developing countries',
    requirements: ['Academic excellence', 'Age limit', 'French language helpful'],
    tags: ['excellence', 'fully-funded', 'european'],
    confidence: 0.86,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '13',
    name: 'Swedish Institute Scholarships',
    sourceUrl: 'https://si.se/en/apply/scholarships/',
    domain: 'si.se',
    country: 'Sweden',
    degreeLevels: ['master'],
    fields: ['all fields'],
    deadline: new Date('2024-02-01'),
    stipend: 1000,
    tuitionCovered: true,
    travelSupport: true,
    eligibilityText: 'Open to citizens of eligible countries',
    requirements: ['Academic excellence', 'Leadership potential', 'English proficiency'],
    tags: ['fully-funded', 'leadership', 'nordic'],
    confidence: 0.84,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '14',
    name: 'Holland Scholarship',
    sourceUrl: 'https://www.studyinnl.org/finances/holland-scholarship',
    domain: 'studyinnl.org',
    country: 'Netherlands',
    degreeLevels: ['bachelor', 'master'],
    fields: ['all fields'],
    deadline: new Date('2024-05-01'),
    stipend: 0,
    tuitionCovered: false,
    travelSupport: false,
    eligibilityText: 'Open to non-EU/EEA students',
    requirements: ['Academic excellence', 'First-time applicant to Dutch institution'],
    tags: ['partial-funding', 'european', 'one-time'],
    confidence: 0.75,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '15',
    name: 'Korean Government Scholarship Program',
    sourceUrl: 'https://www.studyinkorea.go.kr/',
    domain: 'studyinkorea.go.kr',
    country: 'South Korea',
    degreeLevels: ['bachelor', 'master', 'phd'],
    fields: ['all fields'],
    deadline: new Date('2024-03-31'),
    stipend: 900,
    tuitionCovered: true,
    travelSupport: true,
    eligibilityText: 'Open to international students',
    requirements: ['Academic excellence', 'Health certificate', 'Korean language study'],
    tags: ['fully-funded', 'cultural-exchange', 'asia'],
    confidence: 0.83,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// Calculate match score based on profile and scholarship
function calculateMatchScore(profile: any, scholarship: Scholarship): {
  score: number
  reasons: string[]
} {
  let score = 0
  const reasons: string[] = []

  // Degree level match (30% weight)
  if (scholarship.degreeLevels.includes(profile.degreeTarget)) {
    score += 30
    reasons.push(`Matches your target degree: ${profile.degreeTarget}`)
  }

  // Field keywords match (25% weight)
  const fieldMatches = profile.fieldKeywords.filter((keyword: string) =>
    scholarship.fields.some((field: string) =>
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

  // Special considerations (10% weight)
  if (profile.gpa && profile.gpa >= 3.5) {
    score += 5
    reasons.push('Strong GPA qualifies for competitive scholarships')
  }
  if (profile.publications && profile.publications > 0) {
    score += 5
    reasons.push('Research experience is valuable')
  }

  return { score: Math.min(100, score), reasons }
}

// Generate cache key for search request
function generateCacheKey(profile: any, filters?: any): string {
  const searchData = {
    nationality: profile.nationality,
    degreeTarget: profile.degreeTarget,
    fieldKeywords: profile.fieldKeywords.sort(),
    filters: filters || {}
  }
  return Buffer.from(JSON.stringify(searchData)).toString('base64')
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const validatedData = SearchRequestSchema.parse(body)

    const { profile, filters, limit, offset } = validatedData

    // Generate cache key
    const cacheKey = generateCacheKey(profile, filters)

    // Check cache first
    const cachedResult = await cache.get<{ scholarships: RankedScholarship[], total: number }>(cacheKeys.search.results(cacheKey))
    if (cachedResult) {
      return NextResponse.json({
        success: true,
        data: {
          scholarships: cachedResult.scholarships.slice(offset, offset + limit),
          total: cachedResult.total,
          processingTime: Date.now() - startTime,
          cacheHit: true
        }
      })
    }

    // Simulate processing stages
    const stages = ['Searching', 'Filtering', 'Ranking', 'Finalizing']

    // In a real implementation, this would:
    // 1. Query the database with filters
    // 2. Apply matching algorithms
    // 3. Use LLM for advanced ranking

    // For now, use mock data
    let scholarships = [...mockScholarships]

    // Apply filters
    if (filters?.countries?.length) {
      scholarships = scholarships.filter(s => filters.countries!.includes(s.country))
    }

    if (filters?.degreeLevels?.length) {
      scholarships = scholarships.filter(s =>
        s.degreeLevels.some(level => filters.degreeLevels!.includes(level))
      )
    }

    if (filters?.fields?.length) {
      scholarships = scholarships.filter(s =>
        s.fields.some(field =>
          filters.fields!.some(filterField =>
            field.toLowerCase().includes(filterField.toLowerCase())
          )
        )
      )
    }

    if (filters?.deadlineBefore) {
      const deadline = new Date(filters.deadlineBefore)
      scholarships = scholarships.filter(s => s.deadline <= deadline)
    }

    if (filters?.minStipend) {
      scholarships = scholarships.filter(s => s.stipend && s.stipend >= filters.minStipend!)
    }

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase()
      scholarships = scholarships.filter(s =>
        s.name.toLowerCase().includes(searchTerm) ||
        s.eligibilityText.toLowerCase().includes(searchTerm) ||
        s.fields.some(field => field.toLowerCase().includes(searchTerm))
      )
    }

    // Calculate basic match scores
    const basicRankedScholarships = scholarships.map(scholarship => {
      const { score, reasons } = calculateMatchScore(profile, scholarship)
      return {
        ...scholarship,
        matchScore: score,
        matchReasons: reasons,
        llmRationale: `This scholarship matches your profile with a ${score}% compatibility score based on ${reasons.length} factors.`
      }
    })

    // Use Gemini AI for advanced ranking if available
    let rankedScholarships: RankedScholarship[] = basicRankedScholarships

    try {
      const { GeminiAIService } = await import('../../../lib/services/geminiAI')
      const geminiService = new GeminiAIService()

      // Get AI-enhanced rankings for top candidates
      const topCandidates = basicRankedScholarships
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, Math.min(10, scholarships.length))

      const aiRankings = await geminiService.rankScholarships(profile, topCandidates, 10)

      // Merge AI rankings with basic scores
      rankedScholarships = basicRankedScholarships.map(scholarship => {
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
      }).sort((a, b) => b.matchScore - a.matchScore)

    } catch (error) {
      console.warn('AI ranking failed, using basic ranking:', error)
      rankedScholarships = basicRankedScholarships.sort((a, b) => b.matchScore - a.matchScore)
    }

    // Cache the results with proper tags
    const cacheData = {
      scholarships: rankedScholarships,
      total: rankedScholarships.length
    }
    await cache.set(cacheKeys.search.results(cacheKey), cacheData, { 
      ttl: 600, // 10 minutes
      tags: [cacheTags.SEARCH, cacheTags.SCHOLARSHIPS, cacheTags.PUBLIC_DATA]
    })

    // Return paginated results
    const paginatedResults = rankedScholarships.slice(offset, offset + limit)

    // Serialize dates to ensure proper JSON serialization
    const serializedResults = paginatedResults.map(scholarship => ({
      ...scholarship,
      deadline: scholarship.deadline.toISOString(),
      createdAt: scholarship.createdAt.toISOString(),
      updatedAt: scholarship.updatedAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: {
        scholarships: serializedResults,
        total: rankedScholarships.length,
        processingTime: Date.now() - startTime,
        cacheHit: false,
        stages: stages.map(stage => ({ name: stage, status: 'complete' }))
      }
    })

  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    const errorId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Enhanced error logging with context
    logger.error('Search API error', errorObj, {
      errorId,
      endpoint: '/api/search',
      method: 'POST',
      processingTime: Date.now() - startTime,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    })

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.issues,
          errorId,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Handle specific error types
    if (errorObj.message.includes('timeout')) {
      return NextResponse.json(
        {
          error: 'Search timeout',
          message: 'The search request took too long to process. Please try again with more specific criteria.',
          errorId,
          timestamp: new Date().toISOString(),
          retryable: true
        },
        { status: 408 }
      )
    }

    if (errorObj.message.includes('cache')) {
      logger.warn('Cache error in search API', errorObj, { errorId })
      // Continue without cache on cache errors
    }

    if (errorObj.message.includes('network') || errorObj.message.includes('fetch')) {
      return NextResponse.json(
        {
          error: 'External service unavailable',
          message: 'Unable to fetch scholarship data. Please try again later.',
          errorId,
          timestamp: new Date().toISOString(),
          retryable: true
        },
        { status: 503 }
      )
    }

    // Generic server error
    return NextResponse.json(
      {
        error: 'Search failed',
        message: process.env.NODE_ENV === 'development' 
          ? errorObj.message 
          : 'An unexpected error occurred while processing your search.',
        errorId,
        timestamp: new Date().toISOString(),
        retryable: true
      },
      { status: 500 }
    )
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'Scholarship Search',
    version: '1.0.0',
    features: [
      'Profile-based matching',
      'Advanced filtering',
      'Intelligent ranking',
      'Caching system',
      'Real-time processing'
    ]
  })
}