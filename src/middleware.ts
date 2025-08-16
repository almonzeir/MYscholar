import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cache, cacheKeys } from './lib/cache/redis'

// Rate limiting store (fallback for cache failures)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configuration
const RATE_LIMITS = {
  '/api/search': { requests: 100, window: 15 * 60 * 1000 }, // 100 requests per 15 minutes
  '/api/cv/parse': { requests: 20, window: 60 * 60 * 1000 }, // 20 requests per hour
  '/api/ai/recommendations': { requests: 50, window: 60 * 60 * 1000 }, // 50 requests per hour
  '/api/admin': { requests: 200, window: 60 * 60 * 1000 } // 200 requests per hour for admin
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

async function isRateLimited(ip: string, path: string): Promise<{ limited: boolean; remaining: number; resetTime: number }> {
  const config = RATE_LIMITS[path as keyof typeof RATE_LIMITS]
  if (!config) return { limited: false, remaining: Infinity, resetTime: 0 }

  const cacheKey = cacheKeys.rateLimit.api(ip, path)
  const now = Date.now()
  
  try {
    // Try to get from cache first
    let entry = await cache.get<{ count: number; resetTime: number }>(cacheKey)
    
    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      entry = {
        count: 1,
        resetTime: now + config.window
      }
      await cache.set(cacheKey, entry, { ttl: Math.ceil(config.window / 1000) })
      return { limited: false, remaining: config.requests - 1, resetTime: entry.resetTime }
    }

    if (entry.count >= config.requests) {
      return { limited: true, remaining: 0, resetTime: entry.resetTime }
    }

  // Increment count
    // Increment count
    entry.count++
    await cache.set(cacheKey, entry, { ttl: Math.ceil((entry.resetTime - now) / 1000) })
    
    return { 
      limited: false, 
      remaining: Math.max(0, config.requests - entry.count), 
      resetTime: entry.resetTime 
    }
    
  } catch (error) {
    // Fallback to in-memory store if cache fails
    console.warn('Rate limit cache failed, using fallback:', error)
    
    const fallbackKey = `${ip}:${path}`
    const entry = rateLimitStore.get(fallbackKey)

    if (!entry || now > entry.resetTime) {
      rateLimitStore.set(fallbackKey, {
        count: 1,
        resetTime: now + config.window
      })
      return { limited: false, remaining: config.requests - 1, resetTime: now + config.window }
    }

    if (entry.count >= config.requests) {
      return { limited: true, remaining: 0, resetTime: entry.resetTime }
    }

    entry.count++
    return { 
      limited: false, 
      remaining: Math.max(0, config.requests - entry.count), 
      resetTime: entry.resetTime 
    }
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Security headers for all requests
  const response = NextResponse.next()
  
  // Add security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.gemini.google.com https://www.googleapis.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const clientIP = getClientIP(request)
    
    // Find matching rate limit config
    const rateLimitPath = Object.keys(RATE_LIMITS).find(path => 
      pathname.startsWith(path)
    )

    if (rateLimitPath) {
      const rateLimitResult = await isRateLimited(clientIP, rateLimitPath)
      
      if (rateLimitResult.limited) {
        const config = RATE_LIMITS[rateLimitPath as keyof typeof RATE_LIMITS]
        const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            message: `Too many requests. Limit: ${config.requests} requests per ${config.window / 60000} minutes.`,
            retryAfter
          },
          { 
            status: 429,
            headers: {
              'Retry-After': retryAfter.toString(),
              'X-RateLimit-Limit': config.requests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
            }
          }
        )
      }
      
      // Add rate limit headers to successful responses
      const config = RATE_LIMITS[rateLimitPath as keyof typeof RATE_LIMITS]
      response.headers.set('X-RateLimit-Limit', config.requests.toString())
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
      response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString())
    }
  }

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    // In a real implementation, check authentication here
    // For now, just add a header to indicate admin access
    response.headers.set('X-Admin-Route', 'true')
  }

  // Add performance headers
  if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300')
  } else {
    response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}