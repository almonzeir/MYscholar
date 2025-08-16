import { NextRequest, NextResponse } from 'next/server'
import { cache, cacheTags } from './redis'
import { logger } from '../utils/logger'

interface CacheConfig {
  ttl?: number
  tags?: string[]
  keyGenerator?: (request: NextRequest) => string
  shouldCache?: (request: NextRequest, response: NextResponse) => boolean
  varyBy?: string[] // Headers to vary cache by
}

interface CachedResponse {
  status: number
  headers: Record<string, string>
  body: any
  timestamp: number
}

// Default cache configurations for different API routes
export const cacheConfigs: Record<string, CacheConfig> = {
  '/api/search': {
    ttl: 600, // 10 minutes
    tags: [cacheTags.SEARCH, cacheTags.SCHOLARSHIPS],
    keyGenerator: (req) => {
      const url = new URL(req.url)
      const body = req.body ? JSON.stringify(req.body) : ''
      return `api:search:${Buffer.from(url.search + body).toString('base64')}`
    },
    shouldCache: (req, res) => req.method === 'POST' && res.status === 200,
    varyBy: ['content-type']
  },
  
  '/api/scholarships': {
    ttl: 1800, // 30 minutes
    tags: [cacheTags.SCHOLARSHIPS, cacheTags.PUBLIC_DATA],
    keyGenerator: (req) => {
      const url = new URL(req.url)
      return `api:scholarships:${Buffer.from(url.pathname + url.search).toString('base64')}`
    },
    shouldCache: (req, res) => req.method === 'GET' && res.status === 200
  },
  
  '/api/profile': {
    ttl: 900, // 15 minutes
    tags: [cacheTags.PROFILES, cacheTags.USER_DATA],
    keyGenerator: (req) => {
      const url = new URL(req.url)
      const userId = req.headers.get('x-user-id') || 'anonymous'
      return `api:profile:${userId}:${Buffer.from(url.search).toString('base64')}`
    },
    shouldCache: (req, res) => req.method === 'GET' && res.status === 200,
    varyBy: ['x-user-id']
  },
  
  '/api/stats': {
    ttl: 300, // 5 minutes
    tags: [cacheTags.STATS, cacheTags.PUBLIC_DATA],
    keyGenerator: (req) => {
      const url = new URL(req.url)
      return `api:stats:${Buffer.from(url.pathname + url.search).toString('base64')}`
    },
    shouldCache: (req, res) => req.method === 'GET' && res.status === 200
  }
}

// Cache middleware function
export function withCache(config?: CacheConfig) {
  return function cacheMiddleware(
    handler: (request: NextRequest) => Promise<NextResponse>
  ) {
    return async function cachedHandler(request: NextRequest): Promise<NextResponse> {
      const startTime = Date.now()
      
      try {
        // Get cache configuration
        const url = new URL(request.url)
        const routeConfig = cacheConfigs[url.pathname] || config
        
        if (!routeConfig) {
          // No caching configured, proceed normally
          return await handler(request)
        }
        
        // Generate cache key
        const cacheKey = routeConfig.keyGenerator 
          ? routeConfig.keyGenerator(request)
          : `api:${url.pathname}:${Buffer.from(url.search).toString('base64')}`
        
        // Add vary headers to cache key if specified
        let varyKey = ''
        if (routeConfig.varyBy) {
          const varyValues = routeConfig.varyBy.map(header => 
            request.headers.get(header) || ''
          ).join(':')
          varyKey = `:vary:${Buffer.from(varyValues).toString('base64')}`
        }
        
        const finalCacheKey = cacheKey + varyKey
        
        // Try to get from cache
        const cachedResponse = await cache.get<CachedResponse>(finalCacheKey)
        
        if (cachedResponse) {
          logger.debug(`Cache hit for ${finalCacheKey}`, {
            age: Date.now() - cachedResponse.timestamp,
            route: url.pathname
          })
          
          // Reconstruct response from cache
          const response = new NextResponse(JSON.stringify(cachedResponse.body), {
            status: cachedResponse.status,
            headers: {
              ...cachedResponse.headers,
              'X-Cache': 'HIT',
              'X-Cache-Age': String(Date.now() - cachedResponse.timestamp),
              'Content-Type': 'application/json'
            }
          })
          
          return response
        }
        
        // Cache miss, execute handler
        const response = await handler(request)
        
        // Check if we should cache this response
        if (routeConfig.shouldCache && !routeConfig.shouldCache(request, response)) {
          return response
        }
        
        // Only cache successful responses by default
        if (!routeConfig.shouldCache && response.status >= 400) {
          return response
        }
        
        // Extract response data for caching
        const responseClone = response.clone()
        const responseBody = await responseClone.json().catch(() => null)
        
        if (responseBody) {
          const cachedResponse: CachedResponse = {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body: responseBody,
            timestamp: Date.now()
          }
          
          // Cache the response
          await cache.set(finalCacheKey, cachedResponse, {
            ttl: routeConfig.ttl || 600,
            tags: routeConfig.tags || [cacheTags.PUBLIC_DATA]
          })
          
          logger.debug(`Cached response for ${finalCacheKey}`, {
            ttl: routeConfig.ttl,
            tags: routeConfig.tags,
            route: url.pathname
          })
        }
        
        // Add cache headers to response
        response.headers.set('X-Cache', 'MISS')
        response.headers.set('X-Cache-Time', String(Date.now() - startTime))
        
        return response
        
      } catch (error) {
        logger.error('Cache middleware error', error instanceof Error ? error : new Error(String(error)))
        
        // On cache error, proceed without caching
        return await handler(request)
      }
    }
  }
}

// Utility function to invalidate cache for specific routes
export async function invalidateRouteCache(route: string, tags?: string[]): Promise<number> {
  try {
    const routeConfig = cacheConfigs[route]
    const tagsToInvalidate = tags || routeConfig?.tags || []
    
    if (tagsToInvalidate.length === 0) {
      logger.warn(`No tags found for route ${route}, cannot invalidate cache`)
      return 0
    }
    
    const invalidated = await cache.invalidateByTags(tagsToInvalidate)
    logger.info(`Invalidated ${invalidated} cache entries for route ${route}`, {
      tags: tagsToInvalidate
    })
    
    return invalidated
  } catch (error) {
    logger.error('Route cache invalidation error', error instanceof Error ? error : new Error(String(error)))
    return 0
  }
}

// Utility function to warm up cache for specific routes
export async function warmupRouteCache(routes: string[]): Promise<number> {
  let warmedCount = 0
  
  for (const route of routes) {
    try {
      // This would typically make actual requests to warm up the cache
      // For now, we'll just log the intent
      logger.info(`Warming up cache for route: ${route}`)
      warmedCount++
    } catch (error) {
      logger.error(`Failed to warm up cache for route ${route}`, error instanceof Error ? error : new Error(String(error)))
    }
  }
  
  return warmedCount
}