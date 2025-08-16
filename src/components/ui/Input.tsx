import React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export default function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-white mb-2"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-white/50">
              {leftIcon}
            </div>
          </div>
        )}
        
        <input
          id={inputId}
          className={cn(
            error ? 'input-field-error' : 'input-field',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="text-white/50">
              {rightIcon}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-error" role="alert">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-white/60">
          {helperText}
        </p>
      )}
    </div>
  )
}