import React from 'react'
import { cn } from '@/lib/utils'

interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  removable?: boolean
  onRemove?: () => void
  onClose?: () => void // Add alias for backward compatibility
  children: React.ReactNode
}

export default function Chip({
  variant = 'default',
  size = 'md',
  removable = false,
  onRemove,
  onClose,
  className,
  children,
  ...props
}: ChipProps) {
  // Use onClose as fallback for onRemove for backward compatibility
  const handleRemove = onRemove || onClose
  const variants = {
    default: 'chip',
    primary: 'chip-primary',
    success: 'chip-success',
    warning: 'chip-warning',
    error: 'chip-error'
  }
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  }

  return (
    <span
      className={cn(
        variants[variant],
        sizes[size],
        removable && 'pr-1',
        className
      )}
      {...props}
    >
      {children}
      {removable && handleRemove && (
        <button
          onClick={handleRemove}
          className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors"
          aria-label="Remove"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  )
}