'use client'

import React, { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Chip from '@/components/ui/Chip'
import Button from '@/components/ui/Button'
import Progress from '@/components/ui/Progress'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { useError } from '@/components/error/ErrorProvider'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  RefreshCw, 
  TrendingUp, 
  Zap,
  BarChart3,
  Settings
} from 'lucide-react'

interface GeminiStats {
  service: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  capabilities: string[]
  health: {
    apiKeyConfigured: boolean
    rateLimitOk: boolean
    quotaAvailable: boolean
  }
  usage: {
    requestsToday: number
    tokensUsed: number
    remainingQuota: number
    rateLimitStatus: {
      requestsThisMinute: number
      maxRequestsPerMinute: number
      resetTime: Date
    }
  }
  performance: {
    cachingEnabled: boolean
    rateLimitingEnabled: boolean
    timeoutMs: number
  }
}

interface Scholarship {
  id: string
  name: string
  sourceUrl: string
  domain: string
  country: string
  degreeLevels: string[]
  fields: string[]
  deadline: Date
  stipend?: number
  tuitionCovered: boolean
  travelSupport: boolean
  eligibilityText: string
  requirements: string[]
  tags: string[]
  confidence: number
  createdAt: Date
  updatedAt: Date
}

interface PerformanceMetrics {
  averageResponseTime: number
  successRate: number
  cacheHitRate: number
  errorRate: number
  totalRequests: number
}

const GeminiMonitoringDashboard: React.FC = () => {
  const [stats, setStats] = useState<GeminiStats | null>(null)
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [loading, setLoading] = useState(true)
  const [scholarshipsLoading, setScholarshipsLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const { reportError } = useError()

  const fetchGeminiStats = async () => {
    try {
      const response = await fetch('/api/ai/recommendations')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
      } else {
        throw new Error(data.error || 'Failed to fetch Gemini stats')
      }
      
      setLastUpdated(new Date())
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), {
        component: 'GeminiMonitoringDashboard',
        action: 'fetchGeminiStats'
      })
    }
  }

  const fetchPerformanceMetrics = async () => {
    try {
      // Mock performance metrics - in real app, this would come from monitoring service
      const mockMetrics: PerformanceMetrics = {
        averageResponseTime: 1200 + Math.random() * 800,
        successRate: 95 + Math.random() * 4,
        cacheHitRate: 65 + Math.random() * 20,
        errorRate: Math.random() * 2,
        totalRequests: stats?.usage.requestsToday || 0
      }
      
      setMetrics(mockMetrics)
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), {
        component: 'GeminiMonitoringDashboard',
        action: 'fetchPerformanceMetrics'
      })
    }
  }

  const fetchScholarships = async () => {
    try {
      setScholarshipsLoading(true)
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profile: {
            nationality: 'International',
            degreeTarget: 'master',
            fieldKeywords: ['computer science', 'engineering'],
            specialStatus: []
          },
          limit: 50
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setScholarships(data.data.scholarships || [])
      } else {
        throw new Error(data.error || 'Failed to fetch scholarships')
      }
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), {
        component: 'GeminiMonitoringDashboard',
        action: 'fetchScholarships'
      })
    } finally {
      setScholarshipsLoading(false)
    }
  }

  const refreshData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchGeminiStats(),
        fetchPerformanceMetrics(),
        fetchScholarships()
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refreshData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'degraded': return 'text-yellow-600'
      case 'unhealthy': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'degraded': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'unhealthy': return <AlertTriangle className="h-5 w-5 text-red-600" />
      default: return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(Math.round(num))
  }

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading Gemini AI monitoring data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gemini AI Monitoring</h2>
          <p className="text-gray-600 mt-1">
            Monitor AI service performance, usage, and health status
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Service Status</p>
                <div className="flex items-center mt-1">
                  {getStatusIcon(stats.status)}
                  <span className={`ml-2 font-semibold capitalize ${getStatusColor(stats.status)}`}>
                    {stats.status}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Requests Today</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatNumber(stats.usage.requestsToday)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tokens Used</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatNumber(stats.usage.tokensUsed)}
                </p>
              </div>
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Quota Remaining</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatNumber(stats.usage.remainingQuota)}
                </p>
              </div>
              <Database className="h-8 w-8 text-green-600" />
            </div>
          </Card>
        </div>
      )}

      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button className="px-3 py-2 text-sm font-medium bg-white text-gray-900 rounded-md shadow-sm">Overview</button>
          <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Live Scholarships</button>
          <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Performance</button>
          <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Usage Details</button>
          <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Health Checks</button>
        </div>

        <div className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Service Information */}
              <Card className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Service Information
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-medium">{stats.service}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version:</span>
                    <Chip variant="outline">{stats.version}</Chip>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="text-sm text-gray-500">
                      {lastUpdated?.toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 block mb-2">Capabilities:</span>
                    <div className="flex flex-wrap gap-2">
                      {stats.capabilities.map((capability, index) => (
                        <Chip key={index} variant="secondary" className="text-xs">
                          {capability}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Rate Limiting */}
              <Card className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Rate Limiting
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Requests This Minute</span>
                      <span className="text-sm font-medium">
                        {stats.usage.rateLimitStatus.requestsThisMinute} / {stats.usage.rateLimitStatus.maxRequestsPerMinute}
                      </span>
                    </div>
                    <Progress 
                      value={(stats.usage.rateLimitStatus.requestsThisMinute / stats.usage.rateLimitStatus.maxRequestsPerMinute) * 100}
                      className="h-2"
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reset Time:</span>
                    <span className="text-sm font-medium">
                      {new Date(stats.usage.rateLimitStatus.resetTime).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Live Scholarship Database</h3>
              <p className="text-gray-600">Real-time view of available scholarships in the system</p>
            </div>
            <div className="flex items-center space-x-2">
              <Chip variant="outline">
                {scholarships.length} scholarships
              </Chip>
              {scholarshipsLoading && (
                <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {scholarships.map((scholarship) => (
              <Card key={scholarship.id} className="hover:shadow-md transition-shadow p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm line-clamp-2">
                        {scholarship.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {scholarship.country} • {scholarship.domain}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {scholarship.degreeLevels.slice(0, 2).map((level, index) => (
                        <Chip key={index} variant="secondary" className="text-xs">
                          {level}
                        </Chip>
                      ))}
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {scholarship.fields.slice(0, 2).map((field, index) => (
                        <Chip key={index} variant="outline" className="text-xs">
                          {field}
                        </Chip>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">
                        Due: {new Date(scholarship.deadline).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-1">
                        {scholarship.tuitionCovered && (
                          <Chip variant="default" className="text-xs bg-green-100 text-green-800">
                            Tuition
                          </Chip>
                        )}
                        {scholarship.stipend && (
                          <Chip variant="default" className="text-xs bg-blue-100 text-blue-800">
                            €{scholarship.stipend}
                          </Chip>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${
                          scholarship.confidence > 0.9 ? 'bg-green-500' :
                          scholarship.confidence > 0.8 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="text-xs text-gray-600">
                          {Math.round(scholarship.confidence * 100)}% confidence
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {scholarship.tags.slice(0, 2).map((tag, index) => (
                          <Chip key={index} variant="outline" className="text-xs">
                            {tag}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  </div>
              </Card>
            ))}
          </div>
          
          {scholarships.length === 0 && !scholarshipsLoading && (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No scholarships found</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchScholarships}
                className="mt-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(metrics.averageResponseTime)}ms
                  </p>
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPercentage(metrics.successRate)}
                  </p>
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatPercentage(metrics.cacheHitRate)}
                  </p>
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Error Rate</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatPercentage(metrics.errorRate)}
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {stats && (
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Usage Analytics
                </h3>
                <p className="text-gray-600 mt-1">
                  Detailed breakdown of API usage and quotas
                </p>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Daily Token Usage</span>
                    <span className="text-sm text-gray-600">
                      {formatNumber(stats.usage.tokensUsed)} / 1,000,000
                    </span>
                  </div>
                  <Progress 
                    value={(stats.usage.tokensUsed / 1000000) * 100}
                    className="h-3"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Requests Today</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {formatNumber(stats.usage.requestsToday)}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">Tokens Consumed</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {formatNumber(stats.usage.tokensUsed)}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Quota Remaining</p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatNumber(stats.usage.remainingQuota)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Health Status</h3>
                  <p className="text-gray-600 mt-1">
                    Current health indicators for the Gemini AI service
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">API Key Configured</span>
                    <Chip variant={stats.health.apiKeyConfigured ? 'default' : 'destructive'}>
                      {stats.health.apiKeyConfigured ? 'Yes' : 'No'}
                    </Chip>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Rate Limit OK</span>
                    <Chip variant={stats.health.rateLimitOk ? 'default' : 'destructive'}>
                      {stats.health.rateLimitOk ? 'OK' : 'Exceeded'}
                    </Chip>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Quota Available</span>
                    <Chip variant={stats.health.quotaAvailable ? 'default' : 'destructive'}>
                      {stats.health.quotaAvailable ? 'Available' : 'Low'}
                    </Chip>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Performance Settings</h3>
                  <p className="text-gray-600 mt-1">
                    Current configuration and optimization settings
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Caching Enabled</span>
                    <Chip variant={stats.performance.cachingEnabled ? 'default' : 'secondary'}>
                      {stats.performance.cachingEnabled ? 'Enabled' : 'Disabled'}
                    </Chip>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Rate Limiting</span>
                    <Chip variant={stats.performance.rateLimitingEnabled ? 'default' : 'secondary'}>
                      {stats.performance.rateLimitingEnabled ? 'Enabled' : 'Disabled'}
                    </Chip>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Request Timeout</span>
                    <span className="font-medium text-gray-700">
                      {stats.performance.timeoutMs / 1000}s
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {stats && stats.status !== 'healthy' && (
        <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            {stats.status === 'degraded' 
              ? 'Gemini AI service is experiencing degraded performance. Some features may be slower than usual.'
              : 'Gemini AI service is currently unhealthy. Please check the configuration and try again.'
            }
          </div>
        </div>
      )}
    </div>
  )
}

const GeminiMonitoringDashboardWithErrorBoundary: React.FC = () => {
  return (
    <ErrorBoundary>
      <GeminiMonitoringDashboard />
    </ErrorBoundary>
  )
}

export default GeminiMonitoringDashboardWithErrorBoundary