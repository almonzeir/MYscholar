import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ScholarshipIngestionService } from '../../../../lib/services/dataIngestion'

// Ingestion request schema
const IngestionRequestSchema = z.object({
  sources: z.array(z.enum(['google', 'rss', 'manual'])).optional().default(['google']),
  degreeLevel: z.enum(['bachelor', 'master', 'phd', 'postdoc']).optional(),
  field: z.string().optional(),
  country: z.string().optional(),
  limit: z.number().min(1).max(200).optional().default(50),
  dryRun: z.boolean().optional().default(false)
})

// Admin authentication middleware (simplified)
function isAuthorizedAdmin(request: NextRequest): boolean {
  // In a real implementation, this would:
  // 1. Check JWT token
  // 2. Verify admin role
  // 3. Check API key
  
  const authHeader = request.headers.get('authorization')
  const adminKey = process.env.ADMIN_API_KEY
  
  if (!adminKey) {
    console.warn('ADMIN_API_KEY not configured')
    return false
  }
  
  return authHeader === `Bearer ${adminKey}`
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    if (!isAuthorizedAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = IngestionRequestSchema.parse(body)
    
    const { sources, degreeLevel, field, country, limit, dryRun } = validatedData

    // Starting scholarship ingestion with validated parameters

    if (dryRun) {
      // Return mock results for dry run
      return NextResponse.json({
        success: true,
        dryRun: true,
        estimatedResults: {
          processed: limit,
          successful: Math.floor(limit * 0.8),
          failed: Math.floor(limit * 0.2),
          errors: ['Sample error: Rate limit exceeded', 'Sample error: Invalid URL format']
        },
        message: 'Dry run completed. No data was actually ingested.'
      })
    }

    // Initialize ingestion service
    const ingestionService = new ScholarshipIngestionService()

    // Start ingestion process
    const results = await ingestionService.ingestScholarships({
      sources,
      degreeLevel,
      field,
      country,
      limit
    })

    return NextResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
      message: `Ingestion completed. Processed ${results.processed} items, ${results.successful} successful, ${results.failed} failed.`
    })

  } catch (error) {
    console.error('Ingestion API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters',
          details: error.issues
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Ingestion failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Get ingestion status and history
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    if (!isAuthorizedAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    // In a real implementation, this would query the database for:
    // - Recent ingestion jobs
    // - Success/failure rates
    // - Data source statistics
    // - Queue status

    const mockStatus = {
      currentJobs: [],
      recentJobs: [
        {
          id: 'job_001',
          sources: ['google'],
          status: 'completed',
          startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
          results: {
            processed: 45,
            successful: 38,
            failed: 7
          }
        },
        {
          id: 'job_002',
          sources: ['rss'],
          status: 'completed',
          startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 23.5 * 60 * 60 * 1000).toISOString(),
          results: {
            processed: 23,
            successful: 20,
            failed: 3
          }
        }
      ],
      statistics: {
        totalScholarships: 1247,
        lastIngestion: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
        successRate: 0.85,
        averageProcessingTime: '2.3 minutes',
        sourceBreakdown: {
          google: 856,
          rss: 234,
          manual: 157
        }
      },
      quotaUsage: {
        googleSearchAPI: {
          dailyQueries: 85,
          remainingQueries: 15,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: mockStatus
    })

  } catch (error) {
    console.error('Ingestion status API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch ingestion status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Cancel running ingestion job
export async function DELETE(request: NextRequest) {
  try {
    // Check admin authorization
    if (!isAuthorizedAdmin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const jobId = url.searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // In a real implementation, this would:
    // 1. Find the running job
    // 2. Cancel the job gracefully
    // 3. Clean up resources
    // 4. Update job status

    return NextResponse.json({
      success: true,
      message: `Ingestion job ${jobId} has been cancelled`,
      jobId
    })

  } catch (error) {
    console.error('Cancel ingestion API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to cancel ingestion job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}