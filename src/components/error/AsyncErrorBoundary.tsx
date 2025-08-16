'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { logger } from '@/lib/utils/logger'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  loadingFallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  onRetry?: () => void | Promise<void>
  retryCount?: number
  maxRetries?: number
  retryDelay?: number
  className?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  isRetrying: boolean
  retryAttempts: number
  errorId: string | null
}

class AsyncErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: number | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false,
      retryAttempts: 0,
      errorId: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `async_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props
    
    logger.error('Async Error Boundary caught an error', error, {
      errorId: this.state.errorId,
      componentStack: errorInfo.componentStack,
      retryAttempts: this.state.retryAttempts,
      isAsync: true
    })

    this.setState({ errorInfo })
    onError?.(error, errorInfo)
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      window.clearTimeout(this.retryTimeoutId)
    }
  }

  private handleRetry = async () => {
    const { onRetry, maxRetries = 3, retryDelay = 1000 } = this.props
    const { retryAttempts } = this.state

    if (retryAttempts >= maxRetries) {
      logger.warn('Max retry attempts reached', {
        errorId: this.state.errorId,
        maxRetries,
        retryAttempts
      })
      return
    }

    this.setState({ isRetrying: true })

    logger.info('Retrying async operation', {
      errorId: this.state.errorId,
      attempt: retryAttempts + 1,
      maxRetries
    })

    try {
      // Add delay before retry
      if (retryDelay > 0) {
        await new Promise(resolve => {
          this.retryTimeoutId = window.setTimeout(resolve, retryDelay)
        })
      }

      // Call custom retry handler if provided
      if (onRetry) {
        await onRetry()
      }

      // Reset error state on successful retry
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRetrying: false,
        retryAttempts: retryAttempts + 1,
        errorId: null
      })
    } catch (retryError) {
      logger.error('Retry failed', retryError instanceof Error ? retryError : new Error(String(retryError)), {
        errorId: this.state.errorId,
        attempt: retryAttempts + 1
      })

      this.setState({
        isRetrying: false,
        retryAttempts: retryAttempts + 1,
        error: retryError instanceof Error ? retryError : new Error(String(retryError))
      })
    }
  }

  private isNetworkError = (error: Error): boolean => {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch') ||
      error.name === 'NetworkError' ||
      error.name === 'TypeError'
    )
  }

  private isTimeoutError = (error: Error): boolean => {
    return (
      error.message.includes('timeout') ||
      error.message.includes('aborted') ||
      error.name === 'TimeoutError' ||
      error.name === 'AbortError'
    )
  }

  private getErrorType = (error: Error): string => {
    if (this.isNetworkError(error)) return 'network'
    if (this.isTimeoutError(error)) return 'timeout'
    return 'unknown'
  }

  private getErrorMessage = (error: Error): string => {
    const errorType = this.getErrorType(error)
    
    switch (errorType) {
      case 'network':
        return 'Network connection failed. Please check your internet connection.'
      case 'timeout':
        return 'Request timed out. The server might be busy.'
      default:
        return 'An unexpected error occurred while loading data.'
    }
  }

  private getRetryButtonText = (): string => {
    const { retryAttempts } = this.state
    const { maxRetries = 3 } = this.props
    
    if (retryAttempts >= maxRetries) {
      return 'Max retries reached'
    }
    
    return retryAttempts === 0 ? 'Try Again' : `Retry (${retryAttempts}/${maxRetries})`
  }

  render() {
    const { hasError, error, isRetrying, retryAttempts, errorId } = this.state
    const { children, fallback, loadingFallback, maxRetries = 3, className } = this.props

    if (isRetrying) {
      if (loadingFallback) {
        return loadingFallback
      }
      
      return (
        <Card className={cn('p-6 text-center space-y-4', className)}>
          <div className="space-y-2">
            <div className="w-8 h-8 mx-auto">
              <svg className="animate-spin w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <p className="text-white/70">Retrying...</p>
          </div>
        </Card>
      )
    }

    if (hasError && error) {
      if (fallback) {
        return fallback
      }

      const errorMessage = this.getErrorMessage(error)
      const errorType = this.getErrorType(error)
      const canRetry = retryAttempts < maxRetries
      const retryButtonText = this.getRetryButtonText()

      return (
        <Card className={cn('p-6 text-center space-y-4', className)}>
          <div className="space-y-2">
            <div className="w-12 h-12 mx-auto bg-error/20 rounded-full flex items-center justify-center">
              {errorType === 'network' ? (
                <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2v2m0 16v2M2 12h2m16 0h2" />
                </svg>
              ) : errorType === 'timeout' ? (
                <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <h3 className="text-lg font-semibold text-white">Loading Failed</h3>
            <p className="text-white/70 text-sm">{errorMessage}</p>
          </div>
          
          {canRetry && (
            <Button 
              onClick={this.handleRetry} 
              variant="primary" 
              size="sm"
              disabled={!canRetry}
            >
              {retryButtonText}
            </Button>
          )}
          
          {!canRetry && (
            <p className="text-xs text-white/50">
              Please refresh the page to try again
            </p>
          )}
          
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left bg-surface-800 p-3 rounded text-xs">
              <summary className="cursor-pointer text-white/80">Error details</summary>
              <div className="mt-2 space-y-1">
                <p className="text-error">{error.message}</p>
                <p className="text-white/60">Type: {errorType}</p>
                <p className="text-white/60">Attempts: {retryAttempts}/{maxRetries}</p>
                {errorId && <p className="text-white/60">ID: {errorId}</p>}
              </div>
            </details>
          )}
        </Card>
      )
    }

    return children
  }
}

export default AsyncErrorBoundary