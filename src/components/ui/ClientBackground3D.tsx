'use client'

import React from 'react'
import Background3D from './Background3D'
import { useDeviceCapability } from '@/lib/hooks/useDeviceCapability'
import { useReducedMotion } from '@/lib/hooks/useReducedMotion'

export default function ClientBackground3D({ className }: { className?: string }) {
  const { capability } = useDeviceCapability()
  const reducedMotion = useReducedMotion()

  return (
    <Background3D 
      className={className}
      deviceCapability={capability}
      reducedMotion={reducedMotion}
    />
  )
}