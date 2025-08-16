import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { GeminiAIService } from '@/lib/services/geminiAI'
import { logger } from '@/lib/utils/logger'

// Recommendation request schema
const RecommendationRequestSchema = z.object({
  profile: z.object({
    nationality: z.string(),
    degreeTarget: z.enum(['bachelor', 'master', 'phd', 'postdoc']),
    fieldKeywords: z.array(z.string()),
    specialStatus: z.array(z.string()).optional().default([]),
    gpa: z.number().optional(),
    languageTests: z.record(z.string(), z.any()).optional(),
    publications: z.number().optional(),
    workExperience: z.number().optional()
  }),
  scholarships: z.array(z.object({
    id: z.string(),
    name: z.string(),
    country: z.string(),
    degreeLevels: z.array(z.string()),
    fields: z.array(z.string()),
    deadline: z.string(),
    stipend: z.number().optional(),
    tuitionCovered: z.boolean(),
    requirements: z.array(z.string()),
    eligibilityText: z.string()
  })),
  type: z.enum(['ranking', 'recommendations', 'enhancement']).default('recommendations')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = RecommendationRequestSchema.parse(body)
    
    const { profile, scholarships, type } = validatedData

    // Validate profile data
    if (!profile || typeof profile !== 'object') {
      return NextResponse.json(
        { error: 'Valid profile data is required' },
        { status: 400 }
      )
    }

    // Validate required profile fields
    const requiredFields = ['nationality', 'degreeTarget', 'fieldKeywords'] as const
    for (const field of requiredFields) {
      if (!profile[field as keyof typeof profile]) {
        return NextResponse.json(
          { error: `Profile ${field} is required` },
          { status: 400 }
        )
      }
    }

    // Validate scholarships array for ranking and recommendations
    if ((type === 'ranking' || type === 'recommendations') && (!scholarships || scholarships.length === 0)) {
      return NextResponse.json(
        { error: 'At least one scholarship is required for ranking and recommendations' },
        { status: 400 }
      )
    }

    const geminiService = new GeminiAIService()

    switch (type) {
      case 'ranking':
        const rankings = await geminiService.rankScholarships(profile, scholarships)
        
        // Validate rankings response
        if (!rankings || !Array.isArray(rankings)) {
          return NextResponse.json(
            { error: 'Failed to generate scholarship rankings' },
            { status: 500 }
          )
        }
        
        return NextResponse.json({
          success: true,
          data: {
            rankings,
            type: 'ranking',
            count: rankings.length
          }
        })

      case 'recommendations':
        const recommendations = await geminiService.generatePersonalizedRecommendations(profile, scholarships)
        
        // Validate recommendations response
        if (!recommendations || typeof recommendations !== 'object') {
          return NextResponse.json(
            { error: 'Failed to generate personalized recommendations' },
            { status: 500 }
          )
        }
        
        return NextResponse.json({
          success: true,
          data: {
            ...recommendations,
            type: 'recommendations'
          }
        })

      case 'enhancement':
        if (scholarships.length === 0) {
          return NextResponse.json(
            { error: 'At least one scholarship required for enhancement' },
            { status: 400 }
          )
        }

        // Validate scholarship object
        const scholarship = scholarships[0]
        if (!scholarship.id || !scholarship.name) {
          return NextResponse.json(
            { error: 'Invalid scholarship data for enhancement' },
            { status: 400 }
          )
        }

        const enhancement = await geminiService.enhanceScholarshipDescription(scholarship, profile)
        
        // Validate enhancement response
        if (!enhancement || typeof enhancement !== 'object') {
          return NextResponse.json(
            { error: 'Failed to generate scholarship enhancement' },
            { status: 500 }
          )
        }
        
        return NextResponse.json({
          success: true,
          data: {
            scholarshipId: scholarship.id,
            ...enhancement,
            type: 'enhancement'
          }
        })

      default:
        return NextResponse.json(
          { error: 'Invalid recommendation type' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('AI recommendations error', error instanceof Error ? error : new Error(String(error)))
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.issues
        },
        { status: 400 }
      )
    }

    // Handle specific error types
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'AI recommendation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Get AI service status and usage
export async function GET() {
  try {
    const geminiService = new GeminiAIService()
    const [usageStats, healthCheck] = await Promise.all([
      geminiService.getUsageStats(),
      geminiService.healthCheck()
    ])

    const statusCode = healthCheck.status === 'unhealthy' ? 503 : 200

    return NextResponse.json({
      success: healthCheck.status !== 'unhealthy',
      data: {
        service: 'Gemini AI Recommendations',
        status: healthCheck.status,
        version: '1.1.0',
        capabilities: [
          'Intelligent scholarship ranking',
          'Personalized recommendations', 
          'Enhanced descriptions',
          'Application strategy advice',
          'Match strength analysis',
          'Rate limiting',
          'Response caching',
          'Usage monitoring'
        ],
        health: {
          apiKeyConfigured: healthCheck.apiKeyConfigured,
          rateLimitOk: healthCheck.rateLimitOk,
          quotaAvailable: healthCheck.quotaAvailable
        },
        usage: {
          requestsToday: usageStats.requestsToday,
          tokensUsed: usageStats.tokensUsed,
          remainingQuota: usageStats.remainingQuota,
          rateLimitStatus: usageStats.rateLimitStatus
        },
        performance: {
          cachingEnabled: true,
          rateLimitingEnabled: true,
          timeoutMs: 30000
        }
      }
    }, { status: statusCode })

  } catch (error) {
    logger.error('AI service status error', error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get AI service status',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}