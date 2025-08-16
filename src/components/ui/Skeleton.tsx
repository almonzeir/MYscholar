import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'title' | 'avatar' | 'rectangular' | 'circular'
  width?: string | number
  height?: string | number
}

export default function Skeleton({
  variant = 'rectangular',
  width,
  height,
  className,
  style,
  ...props
}: SkeletonProps) {
  const variants = {
    text: 'skeleton-text',
    title: 'skeleton-title', 
    avatar: 'skeleton-avatar',
    rectangular: 'skeleton',
    circular: 'skeleton rounded-full'
  }

  const customStyle = {
    ...style,
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && { height: typeof height === 'number' ? `${height}px` : height })
  }

  return (
    <div
      className={cn(variants[variant], className)}
      style={customStyle}
      {...props}
    />
  )
}

// Skeleton composition components
export function SkeletonCard() {
  return (
    <div className="glass-card p-6 space-y-4">
      <Skeleton variant="title" />
      <Skeleton variant="text" />
      <Skeleton variant="text" width="60%" />
      <div className="flex space-x-2">
        <Skeleton width={80} height={24} className="rounded-full" />
        <Skeleton width={60} height={24} className="rounded-full" />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton variant="avatar" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="title" width="40%" />
            <Skeleton variant="text" width="80%" />
          </div>
        </div>
      ))}
    </div>
  )
}