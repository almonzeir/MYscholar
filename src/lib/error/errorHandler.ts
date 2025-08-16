/**
 * Global error handler for the application
 * Provides centralized error handling, reporting, and recovery mechanisms
 */

import { logger } from '@/lib/utils/logger'
import { errorMonitoring } from './errorMonitoring'

export interface ErrorContext {
  userId?: string
  sessionId?: string
  route?: string
  component?: string
  action?: string
  timestamp: string
  userAgent: string
  url: string
  [key: string]: any
}

export interface ErrorReport {
  id: string
  error: Error
  context: ErrorContext
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'ui' | 'api' | 'auth' | 'data' | 'network' | 'unknown'
  recoverable: boolean
  reported: boolean
}

class GlobalErrorHandler {
  private errorReports: Map<string, ErrorReport> = new Map()
  private errorListeners: Array<(report: ErrorReport) => void> = []
  private isInitialized = false

  initialize() {
    if (this.isInitialized) return

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection)
    
    // Handle global JavaScript errors
    window.addEventListener('error', this.handleGlobalError)
    
    // Handle React error boundary errors (custom event)
    window.addEventListener('react-error', this.handleReactError as EventListener)

    this.isInitialized = true
    logger.info('Global error handler initialized')
  }

  cleanup() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection)
    window.removeEventListener('error', this.handleGlobalError)
    window.removeEventListener('react-error', this.handleReactError as EventListener)
    
    this.errorReports.clear()
    this.errorListeners = []
    this.isInitialized = false
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    
    this.captureError(error, {
      category: 'api',
      severity: 'high',
      context: {
        type: 'unhandled_promise_rejection',
        reason: event.reason
      }
    })

    // Prevent the default browser behavior
    event.preventDefault()
  }

  private handleGlobalError = (event: ErrorEvent) => {
    const error = event.error || new Error(event.message)
    
    this.captureError(error, {
      category: 'ui',
      severity: 'medium',
      context: {
        type: 'global_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    })
  }

  private handleReactError = (event: CustomEvent) => {
    const { error, errorInfo, component } = event.detail
    
    this.captureError(error, {
      category: 'ui',
      severity: 'high',
      context: {
        type: 'react_error',
        component,
        componentStack: errorInfo?.componentStack
      }
    })
  }

  captureError(
    error: Error,
    options: {
      category?: ErrorReport['category']
      severity?: ErrorReport['severity']
      context?: Partial<ErrorContext>
      recoverable?: boolean
    } = {}
  ): string {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const context: ErrorContext = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      route: window.location.pathname,
      ...options.context
    }

    const report: ErrorReport = {
      id: errorId,
      error,
      context,
      severity: options.severity || this.determineSeverity(error),
      category: options.category || this.categorizeError(error),
      recoverable: options.recoverable ?? this.isRecoverable(error),
      reported: false
    }

    this.errorReports.set(errorId, report)
    
    // Record error in monitoring system
    errorMonitoring.recordError(report)
    
    // Log the error
    logger.error(`Global error captured: ${error.message}`, error, {
      errorId,
      category: report.category,
      severity: report.severity,
      recoverable: report.recoverable,
      context
    })

    // Notify listeners
    this.notifyListeners(report)

    // Report to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportToExternalService(report)
    }

    return errorId
  }

  private determineSeverity(error: Error): ErrorReport['severity'] {
    // Critical errors that break core functionality
    if (
      error.message.includes('ChunkLoadError') ||
      error.message.includes('Loading chunk') ||
      error.name === 'ChunkLoadError'
    ) {
      return 'critical'
    }

    // High severity for auth and data errors
    if (
      error.message.includes('auth') ||
      error.message.includes('unauthorized') ||
      error.message.includes('forbidden') ||
      error.message.includes('database')
    ) {
      return 'high'
    }

    // Medium severity for network and API errors
    if (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout')
    ) {
      return 'medium'
    }

    return 'low'
  }

  private categorizeError(error: Error): ErrorReport['category'] {
    if (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout')
    ) {
      return 'network'
    }

    if (
      error.message.includes('auth') ||
      error.message.includes('unauthorized') ||
      error.message.includes('forbidden')
    ) {
      return 'auth'
    }

    if (
      error.message.includes('database') ||
      error.message.includes('query') ||
      error.message.includes('data')
    ) {
      return 'data'
    }

    if (
      error.message.includes('api') ||
      error.message.includes('endpoint') ||
      error.message.includes('response')
    ) {
      return 'api'
    }

    return 'ui'
  }

  private isRecoverable(error: Error): boolean {
    // Non-recoverable errors
    const nonRecoverablePatterns = [
      'ChunkLoadError',
      'Loading chunk',
      'Script error',
      'SecurityError'
    ]

    return !nonRecoverablePatterns.some(pattern => 
      error.message.includes(pattern) || error.name.includes(pattern)
    )
  }

  private async reportToExternalService(report: ErrorReport) {
    try {
      // In a real application, you would send this to your error tracking service
      // e.g., Sentry, Bugsnag, LogRocket, etc.
      
      const payload = {
        id: report.id,
        message: report.error.message,
        stack: report.error.stack,
        name: report.error.name,
        severity: report.severity,
        category: report.category,
        context: report.context,
        recoverable: report.recoverable,
        timestamp: report.context.timestamp
      }

      // Simulate API call to error tracking service
      console.log('Reporting error to external service:', payload)
      
      // Mark as reported
      report.reported = true
      
    } catch (reportingError) {
      logger.error('Failed to report error to external service', 
        reportingError instanceof Error ? reportingError : new Error(String(reportingError))
      )
    }
  }

  private notifyListeners(report: ErrorReport) {
    this.errorListeners.forEach(listener => {
      try {
        listener(report)
      } catch (listenerError) {
        logger.error('Error in error listener', 
          listenerError instanceof Error ? listenerError : new Error(String(listenerError))
        )
      }
    })
  }

  addErrorListener(listener: (report: ErrorReport) => void) {
    this.errorListeners.push(listener)
    return () => {
      const index = this.errorListeners.indexOf(listener)
      if (index > -1) {
        this.errorListeners.splice(index, 1)
      }
    }
  }

  getErrorReport(errorId: string): ErrorReport | undefined {
    return this.errorReports.get(errorId)
  }

  getAllErrorReports(): ErrorReport[] {
    return Array.from(this.errorReports.values())
  }

  clearErrorReports() {
    this.errorReports.clear()
  }

  getErrorStats() {
    const reports = this.getAllErrorReports()
    const stats = {
      total: reports.length,
      bySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      byCategory: {
        ui: 0,
        api: 0,
        auth: 0,
        data: 0,
        network: 0,
        unknown: 0
      },
      recoverable: 0,
      reported: 0
    }

    reports.forEach(report => {
      stats.bySeverity[report.severity]++
      stats.byCategory[report.category]++
      if (report.recoverable) stats.recoverable++
      if (report.reported) stats.reported++
    })

    return stats
  }
}

// Create singleton instance
export const globalErrorHandler = new GlobalErrorHandler()

// Utility function to dispatch React errors to global handler
export const dispatchReactError = (error: Error, errorInfo: any, component?: string) => {
  const event = new CustomEvent('react-error', {
    detail: { error, errorInfo, component }
  })
  window.dispatchEvent(event)
}

// Utility function for manual error reporting
export const reportError = (
  error: Error | string,
  context?: Partial<ErrorContext>,
  options?: {
    category?: ErrorReport['category']
    severity?: ErrorReport['severity']
    recoverable?: boolean
  }
) => {
  const errorObj = typeof error === 'string' ? new Error(error) : error
  return globalErrorHandler.captureError(errorObj, { context, ...options })
}