'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, Button, Chip, Progress } from '@/components/ui'
import { ErrorBoundary, useError } from '@/components/error'
import { loggingService } from '@/lib/logging/loggingService'
import { cn } from '@/lib/utils'

interface SystemHealthDashboardProps {
  className?: string
}

interface SystemMetrics {
  uptime: number
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }
  performance: {
    averageResponseTime: number
    requestsPerMinute: number
    errorRate: number
  }
  database: {
    connectionStatus: 'healthy' | 'degraded' | 'down'
    queryTime: number
    activeConnections: number
  }
  cache: {
    hitRate: number
    missRate: number
    evictionRate: number
  }
  api: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    averageLatency: number
  }
}

interface HealthCheck {
  id: string
  name: string
  status: 'healthy' | 'warning' | 'critical'
  message: string
  lastChecked: number
  responseTime?: number
}

const SystemHealthDashboard: React.FC<SystemHealthDashboardProps> = ({ className }) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const { reportError } = useError()

  // Mock system metrics (in real implementation, these would come from monitoring APIs)
  const generateMockMetrics = useCallback((): SystemMetrics => {
    const now = Date.now()
    const baseTime = now - (Math.random() * 1000 * 60 * 60 * 24) // Random time in last 24h
    
    return {
      uptime: now - baseTime,
      memoryUsage: {
        used: Math.floor(Math.random() * 8000) + 2000, // 2-10GB
        total: 16000, // 16GB
        percentage: 0
      },
      performance: {
        averageResponseTime: Math.floor(Math.random() * 500) + 100, // 100-600ms
        requestsPerMinute: Math.floor(Math.random() * 1000) + 500, // 500-1500 rpm
        errorRate: Math.random() * 5 // 0-5%
      },
      database: {
        connectionStatus: Math.random() > 0.1 ? 'healthy' : Math.random() > 0.5 ? 'degraded' : 'down',
        queryTime: Math.floor(Math.random() * 100) + 10, // 10-110ms
        activeConnections: Math.floor(Math.random() * 50) + 10 // 10-60 connections
      },
      cache: {
        hitRate: Math.random() * 30 + 70, // 70-100%
        missRate: 0,
        evictionRate: Math.random() * 5 // 0-5%
      },
      api: {
        totalRequests: Math.floor(Math.random() * 10000) + 5000,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: Math.floor(Math.random() * 200) + 50 // 50-250ms
      }
    }
  }, [])

  // Generate mock health checks
  const generateMockHealthChecks = useCallback((): HealthCheck[] => {
    const checks = [
      { name: 'Database Connection', id: 'db' },
      { name: 'Redis Cache', id: 'redis' },
      { name: 'External API', id: 'api' },
      { name: 'File System', id: 'fs' },
      { name: 'Memory Usage', id: 'memory' },
      { name: 'Disk Space', id: 'disk' }
    ]

    return checks.map(check => {
      const random = Math.random()
      const status = random > 0.8 ? 'critical' : random > 0.6 ? 'warning' : 'healthy'
      
      return {
        ...check,
        status,
        message: status === 'healthy' ? 'All systems operational' :
                status === 'warning' ? 'Performance degraded' : 'Service unavailable',
        lastChecked: Date.now() - Math.floor(Math.random() * 60000), // Last minute
        responseTime: Math.floor(Math.random() * 1000) + 50
      }
    })
  }, [])

  // Refresh system data
  const refreshData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const newMetrics = generateMockMetrics()
      // Calculate derived values
      newMetrics.memoryUsage.percentage = (newMetrics.memoryUsage.used / newMetrics.memoryUsage.total) * 100
      newMetrics.cache.missRate = 100 - newMetrics.cache.hitRate
      newMetrics.api.successfulRequests = Math.floor(newMetrics.api.totalRequests * (1 - newMetrics.performance.errorRate / 100))
      newMetrics.api.failedRequests = newMetrics.api.totalRequests - newMetrics.api.successfulRequests
      
      setMetrics(newMetrics)
      setHealthChecks(generateMockHealthChecks())
      
      // Log system health check
      loggingService.logSystemHealth({
        timestamp: Date.now(),
        status: 'checked',
        metrics: {
          memoryUsage: newMetrics.memoryUsage.percentage,
          responseTime: newMetrics.performance.averageResponseTime,
          errorRate: newMetrics.performance.errorRate
        }
      })
      
    } catch (error) {
      reportError(error instanceof Error ? error : new Error('Failed to refresh system data'), {
        component: 'SystemHealthDashboard',
        action: 'refreshData'
      })
    } finally {
      setLoading(false)
    }
  }, [generateMockMetrics, generateMockHealthChecks, reportError])

  // Auto-refresh effect
  useEffect(() => {
    refreshData()
    
    if (autoRefresh) {
      const interval = setInterval(refreshData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [refreshData, autoRefresh])

  // Calculate overall system health
  const systemHealth = useMemo(() => {
    if (!metrics || !healthChecks.length) return 'unknown'
    
    const criticalChecks = healthChecks.filter(check => check.status === 'critical').length
    const warningChecks = healthChecks.filter(check => check.status === 'warning').length
    
    if (criticalChecks > 0) return 'critical'
    if (warningChecks > 1) return 'warning'
    if (warningChecks > 0) return 'degraded'
    return 'healthy'
  }, [metrics, healthChecks])

  // Format uptime
  const formatUptime = useCallback((uptime: number) => {
    const seconds = Math.floor(uptime / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }, [])

  // Format bytes
  const formatBytes = useCallback((bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }, [])

  // Run health check
  const runHealthCheck = useCallback(async (checkId: string) => {
    try {
      setHealthChecks(prev => prev.map(check => 
        check.id === checkId 
          ? { ...check, lastChecked: Date.now(), status: 'healthy', message: 'Check in progress...' }
          : check
      ))
      
      // Simulate health check
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const random = Math.random()
      const status = random > 0.9 ? 'critical' : random > 0.7 ? 'warning' : 'healthy'
      
      setHealthChecks(prev => prev.map(check => 
        check.id === checkId 
          ? { 
              ...check, 
              status,
              message: status === 'healthy' ? 'All systems operational' :
                      status === 'warning' ? 'Performance degraded' : 'Service unavailable',
              responseTime: Math.floor(Math.random() * 1000) + 50
            }
          : check
      ))
      
      loggingService.logSystemHealth({
        timestamp: Date.now(),
        status: 'health_check',
        checkId,
        result: status
      })
      
    } catch (error) {
      reportError(error instanceof Error ? error : new Error('Health check failed'), {
        component: 'SystemHealthDashboard',
        action: 'runHealthCheck',
        checkId
      })
    }
  }, [reportError])

  if (loading && !metrics) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-surface-700 rounded mb-2"></div>
                <div className="h-8 bg-surface-700 rounded"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary
      level="feature"
      onError={(error, errorInfo) => {
        reportError(error, {
          component: 'SystemHealthDashboard',
          systemHealth,
          errorInfo
        })
      }}
    >
      <div className={cn('space-y-6', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">System Health</h1>
            <p className="text-white/60">Monitor system performance and health status</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-3 h-3 rounded-full',
                systemHealth === 'healthy' ? 'bg-success' :
                systemHealth === 'degraded' ? 'bg-warning' :
                systemHealth === 'warning' ? 'bg-warning' :
                systemHealth === 'critical' ? 'bg-error' : 'bg-surface-500'
              )} />
              <span className="text-sm text-white capitalize">{systemHealth}</span>
            </div>
            
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? 'primary' : 'secondary'}
              size="sm"
            >
              {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
            </Button>
            
            <Button onClick={refreshData} variant="secondary" size="sm" disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* System Overview */}
        {metrics && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Uptime</p>
                    <p className="text-2xl font-bold text-success">{formatUptime(metrics.uptime)}</p>
                  </div>
                  <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Memory Usage</p>
                    <p className="text-2xl font-bold text-white">{metrics.memoryUsage.percentage.toFixed(1)}%</p>
                    <p className="text-xs text-white/50">
                      {formatBytes(metrics.memoryUsage.used * 1024 * 1024)} / {formatBytes(metrics.memoryUsage.total * 1024 * 1024)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-info/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                </div>
                <Progress value={metrics.memoryUsage.percentage} className="h-2 mt-2" />
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Response Time</p>
                    <p className="text-2xl font-bold text-white">{metrics.performance.averageResponseTime}ms</p>
                    <p className="text-xs text-white/50">{metrics.performance.requestsPerMinute} req/min</p>
                  </div>
                  <div className="w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Error Rate</p>
                    <p className={cn(
                      'text-2xl font-bold',
                      metrics.performance.errorRate > 5 ? 'text-error' :
                      metrics.performance.errorRate > 2 ? 'text-warning' : 'text-success'
                    )}>
                      {metrics.performance.errorRate.toFixed(2)}%
                    </p>
                  </div>
                  <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    metrics.performance.errorRate > 5 ? 'bg-error/20' :
                    metrics.performance.errorRate > 2 ? 'bg-warning/20' : 'bg-success/20'
                  )}>
                    <svg className={cn(
                      'w-6 h-6',
                      metrics.performance.errorRate > 5 ? 'text-error' :
                      metrics.performance.errorRate > 2 ? 'text-warning' : 'text-success'
                    )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </Card>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Database Health */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Database</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Connection Status</span>
                    <Chip 
                      variant={metrics.database.connectionStatus === 'healthy' ? 'success' :
                              metrics.database.connectionStatus === 'degraded' ? 'warning' : 'error'}
                      size="sm"
                    >
                      {metrics.database.connectionStatus}
                    </Chip>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Query Time</span>
                    <span className="text-sm text-white">{metrics.database.queryTime}ms</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Active Connections</span>
                    <span className="text-sm text-white">{metrics.database.activeConnections}</span>
                  </div>
                </div>
              </Card>
              
              {/* Cache Performance */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Cache</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/60">Hit Rate</span>
                      <span className="text-sm text-white">{metrics.cache.hitRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.cache.hitRate} className="h-2" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Miss Rate</span>
                    <span className="text-sm text-white">{metrics.cache.missRate.toFixed(1)}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Eviction Rate</span>
                    <span className="text-sm text-white">{metrics.cache.evictionRate.toFixed(1)}%</span>
                  </div>
                </div>
              </Card>
              
              {/* API Performance */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">API</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Total Requests</span>
                    <span className="text-sm text-white">{metrics.api.totalRequests.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Success Rate</span>
                    <span className="text-sm text-success">
                      {((metrics.api.successfulRequests / metrics.api.totalRequests) * 100).toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Average Latency</span>
                    <span className="text-sm text-white">{metrics.api.averageLatency}ms</span>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Health Checks */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Health Checks</h3>
            <Button
              onClick={() => healthChecks.forEach(check => runHealthCheck(check.id))}
              variant="secondary"
              size="sm"
            >
              Run All Checks
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthChecks.map((check) => (
              <div key={check.id} className="p-4 bg-surface-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{check.name}</span>
                  <Chip 
                    variant={check.status === 'healthy' ? 'success' :
                            check.status === 'warning' ? 'warning' : 'error'}
                    size="sm"
                  >
                    {check.status}
                  </Chip>
                </div>
                
                <p className="text-xs text-white/60 mb-2">{check.message}</p>
                
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>Last checked: {new Date(check.lastChecked).toLocaleTimeString()}</span>
                  {check.responseTime && (
                    <span>{check.responseTime}ms</span>
                  )}
                </div>
                
                <Button
                  onClick={() => runHealthCheck(check.id)}
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2"
                >
                  Run Check
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </ErrorBoundary>
  )
}

export default SystemHealthDashboard