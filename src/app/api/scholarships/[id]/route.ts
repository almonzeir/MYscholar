import { NextRequest, NextResponse } from 'next/server'
import { cache, cacheKeys } from '../../../../lib/cache/redis'
import type { Scholarship } from '../../../../types/database'
import { logger } from '../../../../lib/utils/logger'

// Mock scholarship details (in real app, this would come from database)
const mockScholarshipDetails: Record<string, Scholarship & { 
  fullDescription: string
  applicationProcess: string[]
  selectionCriteria: string[]
  benefits: string[]
  contactInfo: {
    email?: string
    website: string
    phone?: string
  }
}> = {
  '1': {
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
    updatedAt: new Date(),
    fullDescription: 'The DAAD Graduate School Scholarship supports outstanding international students pursuing graduate studies in Germany. This prestigious program offers comprehensive funding for Master\'s and PhD programs at German universities, with a focus on academic excellence and research potential.',
    applicationProcess: [
      'Submit online application through DAAD portal',
      'Provide academic transcripts and certificates',
      'Submit research proposal (for PhD applicants)',
      'Obtain letters of recommendation',
      'Demonstrate German or English language proficiency',
      'Attend interview if selected'
    ],
    selectionCriteria: [
      'Academic excellence (minimum GPA 3.5)',
      'Research potential and motivation',
      'Language proficiency',
      'Leadership qualities',
      'Relevance of proposed study to home country development'
    ],
    benefits: [
      '€1,200 monthly stipend',
      'Full tuition coverage',
      'Health insurance',
      'Travel allowance',
      'German language course funding',
      'Research and thesis allowance'
    ],
    contactInfo: {
      email: 'info@daad.de',
      website: 'https://www.daad.de/en/',
      phone: '+49 228 882-0'
    }
  },
  '2': {
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
    updatedAt: new Date(),
    fullDescription: 'The Fulbright Foreign Student Program enables graduate students, young professionals and artists from abroad to study and conduct research in the United States. The program fosters mutual understanding between the people of the United States and other countries through educational exchange.',
    applicationProcess: [
      'Apply through your home country Fulbright Commission',
      'Submit academic transcripts',
      'Provide statement of purpose',
      'Obtain three letters of recommendation',
      'Take required English proficiency tests',
      'Participate in interviews and selection process'
    ],
    selectionCriteria: [
      'Academic and professional achievement',
      'Leadership potential',
      'English language proficiency',
      'Feasibility of proposed study',
      'Personal qualities and adaptability'
    ],
    benefits: [
      'Full tuition and fees',
      'Monthly living stipend ($2,000+)',
      'Round-trip airfare',
      'Health insurance',
      'Cultural enrichment programs',
      'Professional development opportunities'
    ],
    contactInfo: {
      website: 'https://foreign.fulbrightonline.org/',
      email: 'fulbright@state.gov'
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Validate ID parameter
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Valid scholarship ID is required' },
        { status: 400 }
      )
    }

    // Validate ID format (assuming UUID or numeric ID)
    const isValidId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || /^\d+$/.test(id)
    if (!isValidId) {
      return NextResponse.json(
        { error: 'Invalid scholarship ID format' },
        { status: 400 }
      )
    }

    // Check cache first
    const cacheKey = cacheKeys.scholarshipDetails(id)
    const cachedScholarship = await cache.get(cacheKey)
    
    if (cachedScholarship) {
      return NextResponse.json({
        success: true,
        data: cachedScholarship,
        cached: true
      })
    }

    // In a real implementation, this would query the database
    // const scholarship = await scholarshipRepository.findById(id)
    
    const scholarship = mockScholarshipDetails[id]
    
    if (!scholarship) {
      return NextResponse.json(
        { error: 'Scholarship not found' },
        { status: 404 }
      )
    }

    // Validate scholarship data structure
    if (!scholarship.id || !scholarship.name) {
      logger.error('Invalid scholarship data structure', new Error(`Scholarship ${id} missing required fields`))
      return NextResponse.json(
        { error: 'Invalid scholarship data' },
        { status: 500 }
      )
    }

    // Cache the result
    await cache.set(cacheKey, scholarship, { ttl: 3600 }) // 1 hour

    return NextResponse.json({
      success: true,
      data: scholarship,
      cached: false
    })

  } catch (error) {
    logger.error('Scholarship details API error', error instanceof Error ? error : new Error(String(error)))
    
    // Handle database connection errors
    if (error instanceof Error && error.message.includes('database')) {
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch scholarship details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Update scholarship (admin only - would need authentication)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const updates = await request.json()

    // In a real implementation:
    // 1. Verify admin authentication
    // 2. Validate update data
    // 3. Update in database
    // 4. Invalidate cache

    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Scholarship updated successfully',
      data: { id, ...updates }
    })

  } catch (error) {
    logger.error('Scholarship update error', error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json(
      { 
        error: 'Failed to update scholarship',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Delete scholarship (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // In a real implementation:
    // 1. Verify admin authentication
    // 2. Delete from database
    // 3. Invalidate cache

    // Clear from cache
    const cacheKey = cacheKeys.scholarshipDetails(id)
    await cache.del(cacheKey)

    return NextResponse.json({
      success: true,
      message: 'Scholarship deleted successfully'
    })

  } catch (error) {
    logger.error('Scholarship deletion error', error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json(
      { 
        error: 'Failed to delete scholarship',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}