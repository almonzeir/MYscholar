import { useState, useEffect } from 'react'

export type DeviceCapability = 'high' | 'medium' | 'low'

interface DeviceInfo {
  capability: DeviceCapability
  supportsWebGL: boolean
  deviceMemory: number | undefined
  hardwareConcurrency: number
  connectionType: string | undefined
}

export function useDeviceCapability(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    capability: 'medium',
    supportsWebGL: false,
    deviceMemory: undefined,
    hardwareConcurrency: 4,
    connectionType: undefined
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check WebGL support
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    const supportsWebGL = !!gl

    // Get device memory (if available)
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory

    // Get hardware concurrency
    const hardwareConcurrency = navigator.hardwareConcurrency || 4

    // Get connection type (if available)
    const connection = (navigator as Navigator & { 
      connection?: { effectiveType?: string }
      mozConnection?: { effectiveType?: string }
      webkitConnection?: { effectiveType?: string }
    }).connection || (navigator as Navigator & { 
      mozConnection?: { effectiveType?: string }
    }).mozConnection || (navigator as Navigator & { 
      webkitConnection?: { effectiveType?: string }
    }).webkitConnection
    const connectionType = connection?.effectiveType

    // Determine capability based on various factors
    let capability: DeviceCapability = 'medium'

    // High capability criteria
    if (
      supportsWebGL &&
      hardwareConcurrency >= 8 &&
      (deviceMemory === undefined || deviceMemory >= 8) &&
      (!connectionType || ['4g', '5g'].includes(connectionType))
    ) {
      capability = 'high'
    }
    // Low capability criteria
    else if (
      !supportsWebGL ||
      hardwareConcurrency <= 2 ||
      (deviceMemory !== undefined && deviceMemory <= 2) ||
      (connectionType && ['slow-2g', '2g', '3g'].includes(connectionType))
    ) {
      capability = 'low'
    }

    setDeviceInfo({
      capability,
      supportsWebGL,
      deviceMemory,
      hardwareConcurrency,
      connectionType
    })
  }, [])

  return deviceInfo
}