import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'glass-hover' | 'glass-interactive'
  children: React.ReactNode
}

export default function Card({
  variant = 'glass',
  className,
  children,
  ...props
}: CardProps) {
  const variants = {
    glass: 'glass-card',
    'glass-hover': 'glass-card-hover',
    'glass-interactive': 'glass-card-interactive'
  }

  return (
    <div
      className={cn(variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  )
}