import { NextRequest, NextResponse } from 'next/server'
import { cache, cacheTags } from '../../../../lib/cache/redis'
import { logger } from '../../../../lib/utils/logger'

// GET /api/admin/cache - Get cache statistics
export async function GET() {
  try {
    const stats = cache.getStats()
    
    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error('Cache stats error', error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json(
      {
        error: 'Failed to get cache statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/cache - Clear cache or invalidate by tags
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const tags = searchParams.get('tags')?.split(',') || []
    const keys = searchParams.get('keys')?.split(',') || []
    
    let result: { cleared?: boolean; invalidated?: number; deleted?: number } = {}
    
    switch (action) {
      case 'clear':
        await cache.clear()
        result.cleared = true
        logger.info('Cache cleared by admin')
        break
        
      case 'invalidate-tags':
        if (tags.length === 0) {
          return NextResponse.json(
            { error: 'No tags provided for invalidation' },
            { status: 400 }
          )
        }
        result.invalidated = await cache.invalidateByTags(tags)
        logger.info(`Cache invalidated by tags: ${tags.join(', ')}, count: ${result.invalidated}`)
        break
        
      case 'delete-keys':
        if (keys.length === 0) {
          return NextResponse.json(
            { error: 'No keys provided for deletion' },
            { status: 400 }
          )
        }
        for (const key of keys) {
          await cache.del(key)
        }
        result.deleted = keys.length
        logger.info(`Cache keys deleted: ${keys.join(', ')}`)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: clear, invalidate-tags, or delete-keys' },
          { status: 400 }
        )
    }
    
    return NextResponse.json({
      success: true,
      data: result
    })
    
  } catch (error) {
    logger.error('Cache management error', error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json(
      {
        error: 'Cache management failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/admin/cache - Warm up cache with common data
export async function POST() {
  try {
    const startTime = Date.now()
    let warmedCount = 0
    
    // Warm up common API responses
    const commonData = {
      countries: ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France'],
      fields: ['Computer Science', 'Engineering', 'Medicine', 'Business', 'Arts', 'Sciences'],
      universities: ['Harvard', 'MIT', 'Stanford', 'Oxford', 'Cambridge']
    }
    
    // Cache common API responses
    await cache.set('api:countries', commonData.countries, { 
      ttl: 3600, // 1 hour
      tags: [cacheTags.PUBLIC_DATA, cacheTags.API]
    })
    warmedCount++
    
    await cache.set('api:fields', commonData.fields, { 
      ttl: 3600,
      tags: [cacheTags.PUBLIC_DATA, cacheTags.API]
    })
    warmedCount++
    
    await cache.set('api:universities', commonData.universities, { 
      ttl: 3600,
      tags: [cacheTags.PUBLIC_DATA, cacheTags.API]
    })
    warmedCount++
    
    // Cache featured scholarships placeholder
    await cache.set('scholarship:featured', [], { 
      ttl: 1800, // 30 minutes
      tags: [cacheTags.SCHOLARSHIPS, cacheTags.PUBLIC_DATA]
    })
    warmedCount++
    
    const processingTime = Date.now() - startTime
    
    logger.info(`Cache warmed up: ${warmedCount} entries in ${processingTime}ms`)
    
    return NextResponse.json({
      success: true,
      data: {
        warmedCount,
        processingTime,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    logger.error('Cache warmup error', error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json(
      {
        error: 'Cache warmup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}