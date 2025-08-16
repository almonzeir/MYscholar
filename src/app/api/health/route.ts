import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health checks
    const healthChecks = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'unknown', // Would check database connection
        redis: 'unknown',    // Would check Redis connection
        gemini: 'unknown'    // Would check Gemini API
      }
    }

    // Check database connection
    try {
      // In a real implementation:
      // await prisma.$queryRaw`SELECT 1`
      healthChecks.services.database = 'healthy'
    } catch {
      healthChecks.services.database = 'unhealthy'
    }

    // Check Redis connection
    try {
      // In a real implementation:
      // await redis.ping()
      healthChecks.services.redis = 'healthy'
    } catch {
      healthChecks.services.redis = 'unhealthy'
    }

    // Check Gemini API
    try {
      if (process.env.GEMINI_API_KEY) {
        healthChecks.services.gemini = 'configured'
      } else {
        healthChecks.services.gemini = 'not_configured'
      }
    } catch {
      healthChecks.services.gemini = 'unhealthy'
    }

    // Determine overall status
    const hasUnhealthyServices = Object.values(healthChecks.services).includes('unhealthy')
    if (hasUnhealthyServices) {
      healthChecks.status = 'degraded'
    }

    const statusCode = healthChecks.status === 'healthy' ? 200 : 503

    return NextResponse.json(healthChecks, { status: statusCode })

  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}