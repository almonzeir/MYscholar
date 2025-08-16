'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { globalErrorHandler, ErrorReport, dispatchReactError } from '@/lib/error/errorHandler'
import { logger } from '@/lib/utils/logger'
import { Toast } from '@/components/ui'

interface ErrorContextValue {
  errors: ErrorReport[]
  reportError: (error: Error | string, context?: any) => string
  clearError: (errorId: string) => void
  clearAllErrors: () => void
  hasErrors: boolean
  criticalErrors: ErrorReport[]
  showErrorToast: (message: string, severity?: 'low' | 'medium' | 'high' | 'critical') => void
}

const ErrorContext = createContext<ErrorContextValue | undefined>(undefined)

interface ErrorProviderProps {
  children: ReactNode
  maxErrors?: number
  showToasts?: boolean
  autoReportReactErrors?: boolean
}

interface ToastState {
  id: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  visible: boolean
}

export function ErrorProvider({ 
  children, 
  maxErrors = 50,
  showToasts = true,
  autoReportReactErrors = true
}: ErrorProviderProps) {
  const [errors, setErrors] = useState<ErrorReport[]>([])
  const [toasts, setToasts] = useState<ToastState[]>([])

  useEffect(() => {
    // Initialize global error handler
    globalErrorHandler.initialize()

    // Listen for new errors
    const unsubscribe = globalErrorHandler.addErrorListener((report) => {
      setErrors(prev => {
        const newErrors = [report, ...prev].slice(0, maxErrors)
        return newErrors
      })

      // Show toast for high severity errors if enabled
      if (showToasts && (report.severity === 'high' || report.severity === 'critical')) {
        showErrorToast(
          getErrorDisplayMessage(report.error, report.severity),
          report.severity
        )
      }
    })

    // Override console.error to capture additional errors
    const originalConsoleError = console.error
    console.error = (...args) => {
      originalConsoleError(...args)
      
      // Try to extract error from console.error arguments
      const errorArg = args.find(arg => arg instanceof Error)
      if (errorArg) {
        globalErrorHandler.captureError(errorArg, {
          category: 'ui',
          severity: 'low',
          context: {
            source: 'console.error',
            args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg))
          }
        })
      }
    }

    return () => {
      unsubscribe()
      globalErrorHandler.cleanup()
      console.error = originalConsoleError
    }
  }, [maxErrors, showToasts])

  const reportError = (error: Error | string, context?: any): string => {
    const errorObj = typeof error === 'string' ? new Error(error) : error
    return globalErrorHandler.captureError(errorObj, {
      context: {
        source: 'manual_report',
        ...context
      }
    })
  }

  const clearError = (errorId: string) => {
    setErrors(prev => prev.filter(error => error.id !== errorId))
  }

  const clearAllErrors = () => {
    setErrors([])
    globalErrorHandler.clearErrorReports()
  }

  const showErrorToast = (message: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') => {
    const toastId = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const newToast: ToastState = {
      id: toastId,
      message,
      severity,
      visible: true
    }

    setToasts(prev => [...prev, newToast])

    // Auto-remove toast after delay
    const delay = severity === 'critical' ? 10000 : severity === 'high' ? 7000 : 5000
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== toastId))
    }, delay)
  }

  const handleToastClose = (toastId: string) => {
    setToasts(prev => prev.map(toast => 
      toast.id === toastId ? { ...toast, visible: false } : toast
    ))
    
    // Remove from state after animation
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== toastId))
    }, 300)
  }

  const criticalErrors = errors.filter(error => error.severity === 'critical')
  const hasErrors = errors.length > 0

  const contextValue: ErrorContextValue = {
    errors,
    reportError,
    clearError,
    clearAllErrors,
    hasErrors,
    criticalErrors,
    showErrorToast
  }

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
      
      {/* Error Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            variant={getToastVariant(toast.severity)}
            message={toast.message}
            visible={toast.visible}
            duration={0} // Manual control
            onClose={() => handleToastClose(toast.id)}
          />
        ))}
      </div>
    </ErrorContext.Provider>
  )
}

// Custom hook to use error context
export function useError() {
  const context = useContext(ErrorContext)
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider')
  }
  return context
}

// Custom hook for error boundary integration
export function useErrorBoundary() {
  const { reportError } = useError()
  
  return {
    captureError: (error: Error, errorInfo?: any, component?: string) => {
      // Report to global handler
      const errorId = reportError(error, {
        component,
        errorInfo,
        source: 'error_boundary'
      })
      
      // Dispatch React error event if auto-reporting is enabled
      dispatchReactError(error, errorInfo, component)
      
      return errorId
    }
  }
}

// Utility functions
function getErrorDisplayMessage(error: Error, severity: 'low' | 'medium' | 'high' | 'critical'): string {
  if (severity === 'critical') {
    return 'A critical error occurred. Please refresh the page.'
  }
  
  if (severity === 'high') {
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Network error. Please check your connection.'
    }
    if (error.message.includes('auth')) {
      return 'Authentication error. Please sign in again.'
    }
    return 'An error occurred. Some features may not work properly.'
  }
  
  return 'Something went wrong. Please try again.'
}

function getToastVariant(severity: 'low' | 'medium' | 'high' | 'critical'): 'success' | 'warning' | 'error' | 'info' {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'error'
    case 'medium':
      return 'warning'
    case 'low':
    default:
      return 'info'
  }
}

// HOC for automatic error boundary wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: {
    fallback?: ReactNode
    level?: 'page' | 'component' | 'feature'
    onError?: (error: Error, errorInfo: any) => void
  }
) {
  const WrappedComponent = (props: P) => {
    const { captureError } = useErrorBoundary()
    
    return (
      <ErrorBoundary
        level={errorBoundaryProps?.level || 'component'}
        fallback={errorBoundaryProps?.fallback}
        onError={(error, errorInfo) => {
          captureError(error, errorInfo, Component.displayName || Component.name)
          errorBoundaryProps?.onError?.(error, errorInfo)
        }}
      >
        <Component {...props} />
      </ErrorBoundary>
    )
  }
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Import ErrorBoundary component
import ErrorBoundary from './ErrorBoundary'