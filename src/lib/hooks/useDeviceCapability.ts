'use client'

import { useState, useEffect } from 'react'

type DeviceCapability = 'high' | 'medium' | 'low'

export function useDeviceCapability() {
  const [capability, setCapability] = useState<DeviceCapability>('medium')

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check device memory
    const memory = (navigator as any).deviceMemory
    
    // Check hardware concurrency
    const cores = navigator.hardwareConcurrency || 4
    
    // Check connection speed
    const connection = (navigator as any).connection
    const effectiveType = connection?.effectiveType || '4g'
    
    // Determine capability based on multiple factors
    let score = 0
    
    // Memory scoring
    if (memory >= 8) score += 3
    else if (memory >= 4) score += 2
    else if (memory >= 2) score += 1
    
    // CPU scoring
    if (cores >= 8) score += 3
    else if (cores >= 4) score += 2
    else if (cores >= 2) score += 1
    
    // Network scoring
    if (effectiveType === '4g') score += 2
    else if (effectiveType === '3g') score += 1
    
    // Determine final capability
    if (score >= 6) setCapability('high')
    else if (score >= 3) setCapability('medium')
    else setCapability('low')
    
  }, [])

  return { capability }
}