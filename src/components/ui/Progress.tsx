import React from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error'
  showLabel?: boolean
  label?: string
}

export default function Progress({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  const sizes = {
    sm: 'h-1',
    md: 'h-2', 
    lg: 'h-3'
  }
  
  const variants = {
    default: 'progress-fill',
    success: 'bg-gradient-to-r from-success to-success/80',
    warning: 'bg-gradient-to-r from-warning to-warning/80',
    error: 'bg-gradient-to-r from-error to-error/80'
  }

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-white">
            {label || 'Progress'}
          </span>
          <span className="text-sm text-white/60">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      
      <div
        className={cn('progress-bar', sizes[size], className)}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        {...props}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            variants[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}