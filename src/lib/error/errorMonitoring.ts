/**
 * Error Monitoring and Analytics Service
 * Provides comprehensive error tracking, analysis, and reporting capabilities
 */

import { logger } from '@/lib/utils/logger'
import { ErrorReport, ErrorContext } from './errorHandler'

interface ErrorMetrics {
  totalErrors: number
  errorsByCategory: Record<string, number>
  errorsBySeverity: Record<string, number>
  errorsByComponent: Record<string, number>
  errorTrends: Array<{
    timestamp: number
    count: number
    category: string
  }>
  topErrors: Array<{
    message: string
    count: number
    lastOccurred: number
  }>
}

interface ErrorAlert {
  id: string
  type: 'spike' | 'threshold' | 'critical'
  message: string
  timestamp: number
  metadata: any
}

interface MonitoringConfig {
  enabled: boolean
  sampleRate: number
  alertThresholds: {
    errorSpike: number // errors per minute
    criticalErrorThreshold: number
    componentErrorThreshold: number
  }
  retentionDays: number
  enableRealTimeAlerts: boolean
}

class ErrorMonitoringService {
  private errors: ErrorReport[] = []
  private alerts: ErrorAlert[] = []
  private config: MonitoringConfig
  private metricsCache: ErrorMetrics | null = null
  private lastMetricsUpdate = 0
  private readonly METRICS_CACHE_TTL = 60000 // 1 minute

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enabled: true,
      sampleRate: 1.0,
      alertThresholds: {
        errorSpike: 10,
        criticalErrorThreshold: 5,
        componentErrorThreshold: 20
      },
      retentionDays: 30,
      enableRealTimeAlerts: true,
      ...config
    }

    // Clean up old errors periodically
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanupOldErrors(), 24 * 60 * 60 * 1000) // Daily cleanup
    }
  }

  /**
   * Record an error for monitoring
   */
  recordError(error: ErrorReport): void {
    if (!this.config.enabled) return

    // Sample errors based on sample rate
    if (Math.random() > this.config.sampleRate) return

    // Add monitoring metadata
    const enrichedError: ErrorReport = {
      ...error,
      context: {
        ...error.context,
        monitoringId: this.generateMonitoringId(),
        sessionId: this.getSessionId(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        timestamp: Date.now()
      }
    }

    this.errors.push(enrichedError)
    this.invalidateMetricsCache()

    // Check for alerts
    if (this.config.enableRealTimeAlerts) {
      this.checkForAlerts(enrichedError)
    }

    // Log for debugging
    logger.debug('Error recorded for monitoring', {
      errorId: enrichedError.id,
      category: enrichedError.category,
      severity: enrichedError.severity,
      component: enrichedError.context?.component
    })
  }

  /**
   * Get current error metrics
   */
  getMetrics(): ErrorMetrics {
    const now = Date.now()
    
    // Return cached metrics if still valid
    if (this.metricsCache && (now - this.lastMetricsUpdate) < this.METRICS_CACHE_TTL) {
      return this.metricsCache
    }

    // Calculate fresh metrics
    const metrics = this.calculateMetrics()
    this.metricsCache = metrics
    this.lastMetricsUpdate = now

    return metrics
  }

  /**
   * Get errors by filter criteria
   */
  getErrors(filters: {
    category?: string
    severity?: string
    component?: string
    timeRange?: { start: number; end: number }
    limit?: number
  } = {}): ErrorReport[] {
    let filteredErrors = [...this.errors]

    // Apply filters
    if (filters.category) {
      filteredErrors = filteredErrors.filter(e => e.category === filters.category)
    }

    if (filters.severity) {
      filteredErrors = filteredErrors.filter(e => e.severity === filters.severity)
    }

    if (filters.component) {
      filteredErrors = filteredErrors.filter(e => e.context?.component === filters.component)
    }

    if (filters.timeRange) {
      filteredErrors = filteredErrors.filter(e => {
        const timestamp = e.context?.timestamp || e.timestamp
        return timestamp >= filters.timeRange!.start && timestamp <= filters.timeRange!.end
      })
    }

    // Sort by timestamp (newest first)
    filteredErrors.sort((a, b) => {
      const aTime = a.context?.timestamp || a.timestamp
      const bTime = b.context?.timestamp || b.timestamp
      return bTime - aTime
    })

    // Apply limit
    if (filters.limit) {
      filteredErrors = filteredErrors.slice(0, filters.limit)
    }

    return filteredErrors
  }

  /**
   * Get active alerts
   */
  getAlerts(): ErrorAlert[] {
    return [...this.alerts].sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Clear an alert
   */
  clearAlert(alertId: string): void {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId)
  }

  /**
   * Get error trends over time
   */
  getErrorTrends(timeRange: { start: number; end: number }, interval: number = 3600000): Array<{
    timestamp: number
    count: number
    categories: Record<string, number>
  }> {
    const trends: Array<{
      timestamp: number
      count: number
      categories: Record<string, number>
    }> = []

    const relevantErrors = this.getErrors({ timeRange })
    
    for (let time = timeRange.start; time <= timeRange.end; time += interval) {
      const intervalEnd = time + interval
      const intervalErrors = relevantErrors.filter(error => {
        const errorTime = error.context?.timestamp || error.timestamp
        return errorTime >= time && errorTime < intervalEnd
      })

      const categories: Record<string, number> = {}
      intervalErrors.forEach(error => {
        categories[error.category] = (categories[error.category] || 0) + 1
      })

      trends.push({
        timestamp: time,
        count: intervalErrors.length,
        categories
      })
    }

    return trends
  }

  /**
   * Export error data for analysis
   */
  exportErrors(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.exportToCsv()
    }
    
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      totalErrors: this.errors.length,
      errors: this.errors,
      metrics: this.getMetrics()
    }, null, 2)
  }

  /**
   * Clear all monitoring data
   */
  clearData(): void {
    this.errors = []
    this.alerts = []
    this.metricsCache = null
    this.lastMetricsUpdate = 0
    
    logger.info('Error monitoring data cleared')
  }

  private calculateMetrics(): ErrorMetrics {
    const totalErrors = this.errors.length
    const errorsByCategory: Record<string, number> = {}
    const errorsBySeverity: Record<string, number> = {}
    const errorsByComponent: Record<string, number> = {}
    const errorCounts: Record<string, number> = {}

    // Calculate distributions
    this.errors.forEach(error => {
      // By category
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1
      
      // By severity
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1
      
      // By component
      const component = error.context?.component || 'unknown'
      errorsByComponent[component] = (errorsByComponent[component] || 0) + 1
      
      // Error message counts
      errorCounts[error.message] = (errorCounts[error.message] || 0) + 1
    })

    // Get error trends for last 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    const errorTrends = this.getErrorTrends(
      { start: oneDayAgo, end: Date.now() },
      60 * 60 * 1000 // 1 hour intervals
    ).map(trend => ({
      timestamp: trend.timestamp,
      count: trend.count,
      category: Object.keys(trend.categories)[0] || 'unknown'
    }))

    // Get top errors
    const topErrors = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => {
        const lastError = this.errors
          .filter(e => e.message === message)
          .sort((a, b) => (b.context?.timestamp || b.timestamp) - (a.context?.timestamp || a.timestamp))[0]
        
        return {
          message,
          count,
          lastOccurred: lastError?.context?.timestamp || lastError?.timestamp || 0
        }
      })

    return {
      totalErrors,
      errorsByCategory,
      errorsBySeverity,
      errorsByComponent,
      errorTrends,
      topErrors
    }
  }

  private checkForAlerts(error: ErrorReport): void {
    const now = Date.now()
    const oneMinuteAgo = now - 60000

    // Check for error spike
    const recentErrors = this.errors.filter(e => 
      (e.context?.timestamp || e.timestamp) > oneMinuteAgo
    )
    
    if (recentErrors.length >= this.config.alertThresholds.errorSpike) {
      this.createAlert('spike', `Error spike detected: ${recentErrors.length} errors in the last minute`, {
        errorCount: recentErrors.length,
        timeWindow: '1 minute'
      })
    }

    // Check for critical errors
    if (error.severity === 'critical') {
      const recentCriticalErrors = this.errors.filter(e => 
        e.severity === 'critical' && (e.context?.timestamp || e.timestamp) > oneMinuteAgo
      )
      
      if (recentCriticalErrors.length >= this.config.alertThresholds.criticalErrorThreshold) {
        this.createAlert('critical', `Multiple critical errors detected: ${recentCriticalErrors.length} in the last minute`, {
          criticalErrorCount: recentCriticalErrors.length,
          latestError: error
        })
      }
    }

    // Check for component-specific error threshold
    const component = error.context?.component
    if (component) {
      const componentErrors = this.errors.filter(e => 
        e.context?.component === component && (e.context?.timestamp || e.timestamp) > oneMinuteAgo
      )
      
      if (componentErrors.length >= this.config.alertThresholds.componentErrorThreshold) {
        this.createAlert('threshold', `High error rate in component '${component}': ${componentErrors.length} errors in the last minute`, {
          component,
          errorCount: componentErrors.length
        })
      }
    }
  }

  private createAlert(type: ErrorAlert['type'], message: string, metadata: any): void {
    const alertId = this.generateAlertId()
    
    // Check if similar alert already exists
    const existingAlert = this.alerts.find(alert => 
      alert.type === type && 
      alert.message === message && 
      (Date.now() - alert.timestamp) < 300000 // 5 minutes
    )
    
    if (existingAlert) return // Don't create duplicate alerts

    const alert: ErrorAlert = {
      id: alertId,
      type,
      message,
      timestamp: Date.now(),
      metadata
    }

    this.alerts.push(alert)
    
    // Log alert
    logger.warn(`Error monitoring alert: ${message}`, {
      alertId,
      type,
      metadata
    })

    // Keep only recent alerts (last 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    this.alerts = this.alerts.filter(alert => alert.timestamp > oneDayAgo)
  }

  private cleanupOldErrors(): void {
    const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000)
    const initialCount = this.errors.length
    
    this.errors = this.errors.filter(error => 
      (error.context?.timestamp || error.timestamp) > cutoffTime
    )
    
    const removedCount = initialCount - this.errors.length
    if (removedCount > 0) {
      logger.info(`Cleaned up ${removedCount} old errors from monitoring data`)
      this.invalidateMetricsCache()
    }
  }

  private exportToCsv(): string {
    const headers = [
      'Timestamp',
      'Error ID',
      'Message',
      'Category',
      'Severity',
      'Component',
      'Stack Trace',
      'User Agent',
      'URL'
    ]

    const rows = this.errors.map(error => [
      new Date(error.context?.timestamp || error.timestamp).toISOString(),
      error.id,
      `"${error.message.replace(/"/g, '""')}"`,
      error.category,
      error.severity,
      error.context?.component || '',
      `"${(error.stack || '').replace(/"/g, '""')}"`,
      error.context?.userAgent || '',
      error.context?.url || ''
    ])

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  private invalidateMetricsCache(): void {
    this.metricsCache = null
    this.lastMetricsUpdate = 0
  }

  private generateMonitoringId(): string {
    return `mon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server'
    
    let sessionId = sessionStorage.getItem('error_monitoring_session')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('error_monitoring_session', sessionId)
    }
    return sessionId
  }
}

// Create singleton instance
export const errorMonitoring = new ErrorMonitoringService({
  enabled: process.env.NODE_ENV === 'production',
  sampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  enableRealTimeAlerts: true
})

// Export types and utilities
export type { ErrorMetrics, ErrorAlert, MonitoringConfig }
export { ErrorMonitoringService }

// Utility functions
export const getErrorInsights = () => {
  const metrics = errorMonitoring.getMetrics()
  const alerts = errorMonitoring.getAlerts()
  
  return {
    summary: {
      totalErrors: metrics.totalErrors,
      activeAlerts: alerts.length,
      topErrorCategory: Object.entries(metrics.errorsByCategory)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'none',
      criticalErrors: metrics.errorsBySeverity.critical || 0
    },
    recommendations: generateRecommendations(metrics, alerts)
  }
}

function generateRecommendations(metrics: ErrorMetrics, alerts: ErrorAlert[]): string[] {
  const recommendations: string[] = []
  
  // High error rate
  if (metrics.totalErrors > 100) {
    recommendations.push('Consider implementing more robust error handling and validation')
  }
  
  // Component-specific issues
  const topErrorComponent = Object.entries(metrics.errorsByComponent)
    .sort(([, a], [, b]) => b - a)[0]
  
  if (topErrorComponent && topErrorComponent[1] > 20) {
    recommendations.push(`Focus on improving error handling in component: ${topErrorComponent[0]}`)
  }
  
  // Critical errors
  if (metrics.errorsBySeverity.critical > 5) {
    recommendations.push('Address critical errors immediately - they may impact user experience')
  }
  
  // Active alerts
  if (alerts.length > 0) {
    recommendations.push('Review and address active error alerts')
  }
  
  return recommendations
}