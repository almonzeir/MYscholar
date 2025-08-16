/**
 * Enhanced logging service with structured logging, error tracking, and performance monitoring
 */

import { logger } from '@/lib/utils/logger'

export interface LogContext {
  userId?: string
  sessionId?: string
  requestId?: string
  route?: string
  method?: string
  userAgent?: string
  ip?: string
  duration?: number
  statusCode?: number
  errorId?: string
  component?: string
  action?: string
  [key: string]: any
}

export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count' | 'percentage'
  timestamp: string
  context?: LogContext
}

export interface SecurityEvent {
  type: 'auth_failure' | 'rate_limit' | 'suspicious_activity' | 'data_breach' | 'unauthorized_access'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  context: LogContext
  timestamp: string
}

class LoggingService {
  private performanceMetrics: PerformanceMetric[] = []
  private securityEvents: SecurityEvent[] = []
  private maxMetrics = 1000
  private maxSecurityEvents = 500

  // API Request Logging
  logApiRequest(context: LogContext) {
    logger.info('API Request', {
      type: 'api_request',
      method: context.method,
      route: context.route,
      userAgent: context.userAgent,
      ip: context.ip,
      requestId: context.requestId,
      timestamp: new Date().toISOString()
    })
  }

  logApiResponse(context: LogContext & { statusCode: number; duration: number }) {
    const logLevel = context.statusCode >= 500 ? 'error' : 
                    context.statusCode >= 400 ? 'warn' : 'info'
    
    logger[logLevel]('API Response', {
      type: 'api_response',
      method: context.method,
      route: context.route,
      statusCode: context.statusCode,
      duration: context.duration,
      requestId: context.requestId,
      timestamp: new Date().toISOString()
    })

    // Track performance metric
    this.trackPerformance({
      name: `api_${context.method?.toLowerCase()}_${context.route?.replace(/\//g, '_')}`,
      value: context.duration,
      unit: 'ms',
      timestamp: new Date().toISOString(),
      context
    })
  }

  // Database Operation Logging
  logDatabaseQuery(operation: string, table: string, duration: number, context?: LogContext) {
    logger.debug('Database Query', {
      type: 'db_query',
      operation,
      table,
      duration,
      ...context,
      timestamp: new Date().toISOString()
    })

    this.trackPerformance({
      name: `db_${operation}_${table}`,
      value: duration,
      unit: 'ms',
      timestamp: new Date().toISOString(),
      context
    })
  }

  logDatabaseError(operation: string, table: string, error: Error, context?: LogContext) {
    logger.error('Database Error', error, {
      type: 'db_error',
      operation,
      table,
      ...context,
      timestamp: new Date().toISOString()
    })
  }

  // Cache Operation Logging
  logCacheOperation(operation: 'get' | 'set' | 'del' | 'clear', key: string, hit?: boolean, context?: LogContext) {
    logger.debug('Cache Operation', {
      type: 'cache_operation',
      operation,
      key,
      hit,
      ...context,
      timestamp: new Date().toISOString()
    })
  }

  logCachePerformance(operation: string, duration: number, hit: boolean, context?: LogContext) {
    this.trackPerformance({
      name: `cache_${operation}`,
      value: duration,
      unit: 'ms',
      timestamp: new Date().toISOString(),
      context: { ...context, hit }
    })
  }

  // Authentication & Security Logging
  logAuthEvent(event: string, success: boolean, context: LogContext) {
    const logLevel = success ? 'info' : 'warn'
    
    logger[logLevel]('Authentication Event', {
      type: 'auth_event',
      event,
      success,
      userId: context.userId,
      ip: context.ip,
      userAgent: context.userAgent,
      timestamp: new Date().toISOString()
    })

    if (!success) {
      this.logSecurityEvent({
        type: 'auth_failure',
        severity: 'medium',
        description: `Authentication failed: ${event}`,
        context,
        timestamp: new Date().toISOString()
      })
    }
  }

  logSecurityEvent(event: SecurityEvent) {
    logger.warn('Security Event', {
      type: 'security_event',
      eventType: event.type,
      severity: event.severity,
      description: event.description,
      ...event.context,
      timestamp: event.timestamp
    })

    this.securityEvents.push(event)
    
    // Keep only recent events
    if (this.securityEvents.length > this.maxSecurityEvents) {
      this.securityEvents = this.securityEvents.slice(-this.maxSecurityEvents)
    }

    // Alert on critical security events
    if (event.severity === 'critical') {
      this.alertCriticalSecurity(event)
    }
  }

  // Performance Monitoring
  trackPerformance(metric: PerformanceMetric) {
    this.performanceMetrics.push(metric)
    
    // Keep only recent metrics
    if (this.performanceMetrics.length > this.maxMetrics) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxMetrics)
    }

    // Log slow operations
    if (metric.unit === 'ms' && metric.value > 5000) {
      logger.warn('Slow Operation Detected', {
        type: 'performance_warning',
        metric: metric.name,
        duration: metric.value,
        context: metric.context
      })
    }
  }

  // Business Logic Logging
  logBusinessEvent(event: string, context: LogContext) {
    logger.info('Business Event', {
      type: 'business_event',
      event,
      ...context,
      timestamp: new Date().toISOString()
    })
  }

  logUserAction(action: string, context: LogContext) {
    logger.info('User Action', {
      type: 'user_action',
      action,
      userId: context.userId,
      sessionId: context.sessionId,
      route: context.route,
      timestamp: new Date().toISOString()
    })
  }

  // Error Correlation
  logErrorContext(errorId: string, context: LogContext) {
    logger.info('Error Context', {
      type: 'error_context',
      errorId,
      ...context,
      timestamp: new Date().toISOString()
    })
  }

  // System Health Monitoring
  logSystemHealth(metrics: {
    memoryUsage?: number
    cpuUsage?: number
    diskUsage?: number
    activeConnections?: number
    cacheHitRate?: number
  }) {
    logger.info('System Health', {
      type: 'system_health',
      ...metrics,
      timestamp: new Date().toISOString()
    })

    // Track system metrics
    Object.entries(metrics).forEach(([key, value]) => {
      if (typeof value === 'number') {
        this.trackPerformance({
          name: `system_${key}`,
          value,
          unit: key.includes('Usage') ? 'percentage' : 'count',
          timestamp: new Date().toISOString()
        })
      }
    })
  }

  // Analytics & Reporting
  getPerformanceStats(timeWindow?: number): {
    averageResponseTime: number
    slowestOperations: PerformanceMetric[]
    totalOperations: number
    errorRate: number
  } {
    const cutoff = timeWindow ? Date.now() - timeWindow : 0
    const recentMetrics = this.performanceMetrics.filter(
      metric => new Date(metric.timestamp).getTime() > cutoff
    )

    const responseTimes = recentMetrics
      .filter(m => m.name.startsWith('api_') && m.unit === 'ms')
      .map(m => m.value)

    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0

    const slowestOperations = recentMetrics
      .filter(m => m.unit === 'ms')
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    return {
      averageResponseTime,
      slowestOperations,
      totalOperations: recentMetrics.length,
      errorRate: 0 // Would need error tracking to calculate
    }
  }

  getSecuritySummary(timeWindow?: number): {
    totalEvents: number
    eventsBySeverity: Record<string, number>
    eventsByType: Record<string, number>
    recentCritical: SecurityEvent[]
  } {
    const cutoff = timeWindow ? Date.now() - timeWindow : 0
    const recentEvents = this.securityEvents.filter(
      event => new Date(event.timestamp).getTime() > cutoff
    )

    const eventsBySeverity = recentEvents.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const eventsByType = recentEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const recentCritical = recentEvents
      .filter(event => event.severity === 'critical')
      .slice(-5)

    return {
      totalEvents: recentEvents.length,
      eventsBySeverity,
      eventsByType,
      recentCritical
    }
  }

  // Private helper methods
  private alertCriticalSecurity(event: SecurityEvent) {
    // In production, this would send alerts to monitoring systems
    logger.error('CRITICAL SECURITY ALERT', new Error(event.description), {
      type: 'critical_security_alert',
      eventType: event.type,
      context: event.context,
      timestamp: event.timestamp
    })
  }

  // Cleanup methods
  clearMetrics() {
    this.performanceMetrics = []
  }

  clearSecurityEvents() {
    this.securityEvents = []
  }
}

// Create singleton instance
export const loggingService = new LoggingService()

// Utility functions for common logging patterns
export const withLogging = <T extends (...args: any[]) => any>(
  fn: T,
  context: { name: string; component?: string }
): T => {
  return ((...args: Parameters<T>) => {
    const start = Date.now()
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      logger.debug(`Starting ${context.name}`, {
        component: context.component,
        requestId,
        args: args.length
      })
      
      const result = fn(...args)
      
      // Handle async functions
      if (result instanceof Promise) {
        return result
          .then(value => {
            const duration = Date.now() - start
            logger.debug(`Completed ${context.name}`, {
              component: context.component,
              requestId,
              duration,
              success: true
            })
            return value
          })
          .catch(error => {
            const duration = Date.now() - start
            logger.error(`Failed ${context.name}`, error, {
              component: context.component,
              requestId,
              duration
            })
            throw error
          })
      }
      
      // Handle sync functions
      const duration = Date.now() - start
      logger.debug(`Completed ${context.name}`, {
        component: context.component,
        requestId,
        duration,
        success: true
      })
      
      return result
    } catch (error) {
      const duration = Date.now() - start
      logger.error(`Failed ${context.name}`, error instanceof Error ? error : new Error(String(error)), {
        component: context.component,
        requestId,
        duration
      })
      throw error
    }
  }) as T
}