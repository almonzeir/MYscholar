'use client'

import React, { useEffect, useState, useMemo } from 'react'

interface Background3DProps {
  reducedMotion?: boolean
  deviceCapability?: 'high' | 'medium' | 'low'
  className?: string
}

interface Particle {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  speed: number
  direction: number
}

export default function Background3D({ 
  reducedMotion = false, 
  deviceCapability = 'high',
  className = ''
}: Background3DProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [mounted, setMounted] = useState(false)

  // Detect user's motion preferences
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches || reducedMotion
  }, [reducedMotion])

  // Generate particles based on device capability
  const particleCount = useMemo(() => {
    if (prefersReducedMotion) return 0
    switch (deviceCapability) {
      case 'high': return 50
      case 'medium': return 25
      case 'low': return 10
      default: return 25
    }
  }, [deviceCapability, prefersReducedMotion])

  // Initialize particles
  useEffect(() => {
    if (particleCount === 0) return

    const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.1,
      speed: Math.random() * 0.5 + 0.1,
      direction: Math.random() * Math.PI * 2
    }))

    setParticles(newParticles)
    setMounted(true)
  }, [particleCount])

  // Animate particles
  useEffect(() => {
    if (prefersReducedMotion || particles.length === 0) return

    const animateParticles = () => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        x: (particle.x + Math.cos(particle.direction) * particle.speed + 100) % 100,
        y: (particle.y + Math.sin(particle.direction) * particle.speed + 100) % 100,
        opacity: particle.opacity + (Math.random() - 0.5) * 0.02
      })))
    }

    const interval = setInterval(animateParticles, 100)
    return () => clearInterval(interval)
  }, [particles.length, prefersReducedMotion])

  if (!mounted) {
    return (
      <div className={`bg-3d-layer ${className}`}>
        <div className="absolute inset-0 bg-gradient-radial" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      </div>
    )
  }

  return (
    <div 
      className={`bg-3d-layer ${className}`}
      role="presentation"
      aria-hidden="true"
    >
      {/* Layer 1: Volumetric gradient glow */}
      <div className="absolute inset-0 bg-gradient-radial" />
      
      {/* Layer 2: Masked grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      
      {/* Layer 3: Floating particles (only if motion allowed) */}
      {!prefersReducedMotion && particles.length > 0 && (
        <div className="absolute inset-0 overflow-hidden">
          {particles.map(particle => (
            <div
              key={particle.id}
              className="absolute w-1 h-1 bg-primary rounded-full"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                opacity: Math.max(0.1, Math.min(0.6, particle.opacity)),
                boxShadow: `0 0 ${particle.size * 2}px rgba(255, 140, 66, ${particle.opacity * 0.5})`,
                transform: `scale(${0.8 + particle.opacity * 0.4})`,
                transition: 'all 0.1s ease-out'
              }}
            />
          ))}
        </div>
      )}
      
      {/* Layer 4: Subtle scholarship motifs (static for accessibility) */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        {/* Graduation cap silhouette */}
        <div 
          className="absolute top-1/4 left-1/4 w-8 h-8 opacity-30"
          style={{
            background: `linear-gradient(45deg, transparent 40%, rgba(255, 177, 90, 0.3) 50%, transparent 60%)`,
            clipPath: 'polygon(20% 60%, 80% 60%, 70% 40%, 30% 40%)'
          }}
        />
        
        {/* Document silhouette */}
        <div 
          className="absolute top-3/4 right-1/3 w-6 h-8 opacity-20"
          style={{
            background: `linear-gradient(to bottom, rgba(139, 94, 52, 0.3) 0%, rgba(139, 94, 52, 0.1) 100%)`,
            clipPath: 'polygon(0% 0%, 85% 0%, 100% 15%, 100% 100%, 0% 100%)'
          }}
        />
        
        {/* Passport stamp silhouette */}
        <div 
          className="absolute top-1/2 right-1/4 w-10 h-6 opacity-25 rounded-sm"
          style={{
            background: `radial-gradient(circle, rgba(255, 140, 66, 0.2) 0%, transparent 70%)`,
            border: '1px dashed rgba(255, 140, 66, 0.3)'
          }}
        />
      </div>
      
      {/* Layer 5: Depth gradient overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, 
            rgba(14, 11, 7, 0.8) 0%, 
            rgba(14, 11, 7, 0.4) 30%, 
            rgba(14, 11, 7, 0.6) 70%, 
            rgba(14, 11, 7, 0.9) 100%
          )`
        }}
      />
    </div>
  )
}