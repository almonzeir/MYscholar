/**
 * Error handling components and utilities
 * Provides comprehensive error boundaries, global error handling, and error reporting
 */

import React from 'react'

export { default as ErrorBoundary } from './ErrorBoundary'
export { default as AsyncErrorBoundary } from './AsyncErrorBoundary'
export { ErrorProvider, useError, useErrorBoundary, withErrorBoundary } from './ErrorProvider'

// Re-export error handler utilities
export {
  globalErrorHandler,
  dispatchReactError,
  reportError,
  type ErrorContext,
  type ErrorReport
} from '@/lib/error/errorHandler'

// Utility function to wrap components with error boundary
// Temporarily commented out due to syntax issues
// export const withAsyncErrorBoundary = <P extends object>(
//   Component: React.ComponentType<P>,
//   options?: {
//     maxRetries?: number
//     retryDelay?: number
//     onRetry?: () => void | Promise<void>
//     fallback?: React.ReactNode
//     loadingFallback?: React.ReactNode
//   }
// ) => {
//   const WrappedComponent = (props: P) => {
//     return (
//       <AsyncErrorBoundary
//         maxRetries={options?.maxRetries}
//         retryDelay={options?.retryDelay}
//         onRetry={options?.onRetry}
//         fallback={options?.fallback}
//         loadingFallback={options?.loadingFallback}
//       >
//         <Component {...props} />
//       </AsyncErrorBoundary>
//     )
//   }
//   
//   WrappedComponent.displayName = `withAsyncErrorBoundary(${Component.displayName || Component.name})`
//   return WrappedComponent
// }

// Utility function for safe async operations
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  options?: {
    retries?: number
    retryDelay?: number
    onError?: (error: Error, attempt: number) => void
    fallback?: T
  }
): Promise<T | undefined> => {
  const { retries = 3, retryDelay = 1000, onError, fallback } = options || {}
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      
      onError?.(errorObj, attempt)
      
      if (attempt === retries) {
        // Report error on final attempt
        reportError(errorObj, {
          operation: operation.name || 'anonymous',
          attempt,
          maxRetries: retries
        })
        
        return fallback
      }
      
      // Wait before retry
      if (retryDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }
  }
  
  return fallback
}

// Utility function for safe component rendering
// Temporarily commented out due to syntax issues
// export const safeRender = <P extends object>(
//   Component: React.ComponentType<P>,
//   fallback?: React.ReactNode
// ) => {
//   const SafeComponent = (props: P) => {
//     try {
//       return <Component {...props} />
//     } catch (error) {
//       reportError(
//         error instanceof Error ? error : new Error(String(error)),
//         {
//           component: Component.displayName || Component.name,
//           props: Object.keys(props || {})
//         }
//       )
//       
//       return fallback || (
//         <div className="p-4 bg-error/10 border border-error/20 rounded-lg">
//           <p className="text-sm text-error">Component failed to render</p>
//         </div>
//       )
//     }
//   }
//   
//   SafeComponent.displayName = `safeRender(${Component.displayName || Component.name})`
//   return SafeComponent
// }