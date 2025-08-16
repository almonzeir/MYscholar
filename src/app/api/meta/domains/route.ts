import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'

// Trusted scholarship domains allowlist
const trustedDomains = [
  // Government and Official Organizations
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
  
  // Universities (Major ones)
  'harvard.edu',
  'mit.edu',
  'stanford.edu',
  'ox.ac.uk',
  'cam.ac.uk',
  'imperial.ac.uk',
  'ethz.ch',
  'epfl.ch',
  'nus.edu.sg',
  'ntu.edu.sg',
  'u-tokyo.ac.jp',
  'kyoto-u.ac.jp',
  'tsinghua.edu.cn',
  'pku.edu.cn',
  'anu.edu.au',
  'unimelb.edu.au',
  'utoronto.ca',
  'mcgill.ca',
  
  // Foundations and NGOs
  'gatesfoundation.org',
  'rhodeshouse.ox.ac.uk',
  'marshallscholarship.org',
  'rotary.org',
  'unesco.org',
  'worldbank.org',
  'undp.org',
  'ford.org',
  'rockefellerfoundation.org',
  
  // Regional Organizations
  'asean.org',
  'africaunion.org',
  'oas.org',
  'apec.org',
  
  // Scholarship Aggregators (Verified)
  'scholarshipportal.com',
  'studyportals.com',
  'scholars4dev.com'
]

// Domain categories for better organization
const domainCategories = {
  government: [
    'daad.de',
    'fulbrightonline.org',
    'chevening.org',
    'commonwealthscholarships.org',
    'erasmusplus.org.uk',
    'europa.eu',
    'britishcouncil.org'
  ],
  universities: [
    'harvard.edu',
    'mit.edu',
    'stanford.edu',
    'ox.ac.uk',
    'cam.ac.uk',
    'imperial.ac.uk',
    'ethz.ch',
    'epfl.ch'
  ],
  foundations: [
    'gatesfoundation.org',
    'rhodeshouse.ox.ac.uk',
    'marshallscholarship.org',
    'rotary.org',
    'ford.org',
    'rockefellerfoundation.org'
  ],
  international: [
    'unesco.org',
    'worldbank.org',
    'undp.org',
    'asean.org',
    'africaunion.org'
  ]
}

// Domain verification levels
const verificationLevels = {
  verified: trustedDomains.slice(0, 20), // Top 20 most trusted
  trusted: trustedDomains.slice(20, 40),
  monitored: trustedDomains.slice(40)
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        domains: trustedDomains,
        categories: domainCategories,
        verification: verificationLevels,
        total: trustedDomains.length,
        lastUpdated: new Date().toISOString()
      },
      metadata: {
        description: 'Trusted scholarship domains allowlist',
        usage: 'Use this list to validate scholarship source URLs',
        updateFrequency: 'Monthly'
      }
    })
  } catch (error) {
    console.error('Domains API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch domains',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Add new domain (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const authHeader = request.headers.get('authorization')
    const adminKey = process.env.ADMIN_API_KEY
    
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { domain, category, verificationLevel } = body

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { error: 'Valid domain is required' },
        { status: 400 }
      )
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['government', 'universities', 'foundations', 'international', 'uncategorized']
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be one of: ' + validCategories.join(', ') },
        { status: 400 }
      )
    }

    // Validate verification level
    const validLevels = ['verified', 'trusted', 'monitored']
    if (verificationLevel && !validLevels.includes(verificationLevel)) {
      return NextResponse.json(
        { error: 'Invalid verification level. Must be one of: ' + validLevels.join(', ') },
        { status: 400 }
      )
    }

    // In a real implementation:
    // 1. Check domain reputation
    // 2. Add to database
    // 3. Update cache

    return NextResponse.json({
      success: true,
      message: 'Domain added successfully',
      data: {
        domain: domain.toLowerCase(),
        category: category || 'uncategorized',
        verificationLevel: verificationLevel || 'monitored',
        addedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    logger.error('Add domain error', error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json(
      { 
        error: 'Failed to add domain'
      },
      { status: 500 }
    )
  }
}

// Verify if a domain is trusted
export async function HEAD(request: Request) {
  try {
    const url = new URL(request.url)
    const domain = url.searchParams.get('domain')

    if (!domain) {
      return new NextResponse(null, { status: 400 })
    }

    const isTrusted = trustedDomains.includes(domain.toLowerCase())
    
    return new NextResponse(null, { 
      status: isTrusted ? 200 : 404,
      headers: {
        'X-Domain-Trusted': isTrusted.toString(),
        'X-Domain-Category': getDomainCategory(domain),
        'X-Verification-Level': getVerificationLevel(domain)
      }
    })

  } catch {
    return new NextResponse(null, { status: 500 })
  }
}

// Helper functions
function getDomainCategory(domain: string): string {
  for (const [category, domains] of Object.entries(domainCategories)) {
    if (domains.includes(domain.toLowerCase())) {
      return category
    }
  }
  return 'uncategorized'
}

function getVerificationLevel(domain: string): string {
  const lowerDomain = domain.toLowerCase()
  
  if (verificationLevels.verified.includes(lowerDomain)) {
    return 'verified'
  } else if (verificationLevels.trusted.includes(lowerDomain)) {
    return 'trusted'
  } else if (verificationLevels.monitored.includes(lowerDomain)) {
    return 'monitored'
  }
  
  return 'unknown'
}