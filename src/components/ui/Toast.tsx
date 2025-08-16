'use client'

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface ToastProps {
  variant?: 'success' | 'warning' | 'error' | 'info'
  title?: string
  message: string
  duration?: number
  onClose?: () => void
  visible?: boolean
}

export default function Toast({
  variant = 'info',
  title,
  message,
  duration = 5000,
  onClose,
  visible = true
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(visible)

  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [visible, duration, onClose])

  useEffect(() => {
    setIsVisible(visible)
  }, [visible])

  if (!isVisible) return null

  const variants = {
    success: 'toast-success',
    warning: 'toast-warning', 
    error: 'toast-error',
    info: 'toast'
  }

  const icons = {
    success: (
      <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 text-warning" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-error" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    )
  }

  return (
    <div className={cn(variants[variant], 'flex items-start space-x-3')}>
      <div className="flex-shrink-0">
        {icons[variant]}
      </div>
      
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-medium text-white">
            {title}
          </p>
        )}
        <p className={cn(
          'text-sm text-white/80',
          title && 'mt-1'
        )}>
          {message}
        </p>
      </div>
      
      {onClose && (
        <button
          onClick={() => {
            setIsVisible(false)
            onClose()
          }}
          className="flex-shrink-0 ml-4 text-white/60 hover:text-white transition-colors"
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}