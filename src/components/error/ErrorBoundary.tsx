'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { logger } from '@/lib/utils/logger'
import { Button, Card } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: 'page' | 'component' | 'feature'
  resetKeys?: Array<string | number>
  resetOnPropsChange?: boolean
  className?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props
    
    // Log error with context
    logger.error(`Error Boundary (${level}) caught an error`, error, {
      errorId: this.state.errorId,
      level,
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name,
      props: this.props.resetKeys ? { resetKeys: this.props.resetKeys } : undefined
    })

    // Update state with error info
    this.setState({ errorInfo })

    // Call custom error handler
    onError?.(error, errorInfo)

    // Report to external error tracking service if in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo)
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state

    // Reset error boundary when resetKeys change
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      )
      
      if (hasResetKeyChanged) {
        this.resetErrorBoundary()
      }
    }

    // Reset on any prop change if enabled
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary()
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId)
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In a real app, you would send this to your error tracking service
    // e.g., Sentry, Bugsnag, LogRocket, etc.
    console.error('Error reported to tracking service:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })
  }

  private resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    })
  }

  private handleRetry = () => {
    logger.info('User triggered error boundary retry', {
      errorId: this.state.errorId,
      level: this.props.level
    })
    this.resetErrorBoundary()
  }

  private handleReload = () => {
    logger.info('User triggered page reload from error boundary', {
      errorId: this.state.errorId,
      level: this.props.level
    })
    window.location.reload()
  }

  render() {
    const { hasError, error, errorId } = this.state
    const { children, fallback, level = 'component', className } = this.props

    if (hasError) {
      // Custom fallback UI
      if (fallback) {
        return fallback
      }

      // Default fallback UI based on level
      return this.renderDefaultFallback(error, errorId, level, className)
    }

    return children
  }

  private renderDefaultFallback = (
    error: Error | null, 
    errorId: string | null, 
    level: string,
    className?: string
  ) => {
    const isPageLevel = level === 'page'
    const isFeatureLevel = level === 'feature'

    if (isPageLevel) {
      return (
        <div className={cn('min-h-screen flex items-center justify-center p-4', className)}>
          <Card className="max-w-md w-full text-center space-y-6">
            <div className="space-y-2">
              <div className="w-16 h-16 mx-auto bg-error/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
              <p className="text-white/70">
                We encountered an unexpected error. Our team has been notified.
              </p>
            </div>
            
            {process.env.NODE_ENV === 'development' && error && (
              <div className="text-left bg-surface-800 p-4 rounded-lg">
                <p className="text-sm font-mono text-error mb-2">{error.message}</p>
                <details className="text-xs text-white/60">
                  <summary className="cursor-pointer hover:text-white/80">Stack trace</summary>
                  <pre className="mt-2 whitespace-pre-wrap">{error.stack}</pre>
                </details>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button onClick={this.handleRetry} variant="primary" className="flex-1">
                Try Again
              </Button>
              <Button onClick={this.handleReload} variant="secondary" className="flex-1">
                Reload Page
              </Button>
            </div>
            
            {errorId && (
              <p className="text-xs text-white/50">
                Error ID: {errorId}
              </p>
            )}
          </Card>
        </div>
      )
    }

    if (isFeatureLevel) {
      return (
        <Card className={cn('p-6 text-center space-y-4', className)}>
          <div className="space-y-2">
            <div className="w-12 h-12 mx-auto bg-warning/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Feature Unavailable</h3>
            <p className="text-white/70 text-sm">
              This feature is temporarily unavailable. Please try again.
            </p>
          </div>
          
          <Button onClick={this.handleRetry} variant="secondary" size="sm">
            Retry
          </Button>
          
          {process.env.NODE_ENV === 'development' && error && (
            <details className="text-left bg-surface-800 p-3 rounded text-xs">
              <summary className="cursor-pointer text-white/80">Error details</summary>
              <pre className="mt-2 text-error whitespace-pre-wrap">{error.message}</pre>
            </details>
          )}
        </Card>
      )
    }

    // Component level fallback
    return (
      <div className={cn('p-4 bg-error/10 border border-error/20 rounded-lg', className)}>
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-error flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">Component Error</p>
            <p className="text-xs text-white/70">Unable to render this component</p>
          </div>
          <Button onClick={this.handleRetry} variant="ghost" size="sm">
            Retry
          </Button>
        </div>
        
        {process.env.NODE_ENV === 'development' && error && (
          <div className="mt-3 pt-3 border-t border-error/20">
            <p className="text-xs font-mono text-error">{error.message}</p>
          </div>
        )}
      </div>
    )
  }
}

export default ErrorBoundary