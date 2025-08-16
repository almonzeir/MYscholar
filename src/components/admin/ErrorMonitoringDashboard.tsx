'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, Button, Chip, Progress } from '@/components/ui'
import { ErrorBoundary, useError } from '@/components/error'
import { errorMonitoring, getErrorInsights, type ErrorMetrics, type ErrorAlert } from '@/lib/error/errorMonitoring'
import { cn } from '@/lib/utils'

interface ErrorMonitoringDashboardProps {
  className?: string
}

type TimeRange = '1h' | '24h' | '7d' | '30d'
type ViewMode = 'overview' | 'errors' | 'alerts' | 'trends'

const ErrorMonitoringDashboard: React.FC<ErrorMonitoringDashboardProps> = ({ className }) => {
  const [metrics, setMetrics] = useState<ErrorMetrics | null>(null)
  const [alerts, setAlerts] = useState<ErrorAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [viewMode, setViewMode] = useState<ViewMode>('overview')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const { reportError } = useError()

  // Refresh data
  const refreshData = useCallback(async () => {
    try {
      setLoading(true)
      const [newMetrics, newAlerts] = await Promise.all([
        Promise.resolve(errorMonitoring.getMetrics()),
        Promise.resolve(errorMonitoring.getAlerts())
      ])
      setMetrics(newMetrics)
      setAlerts(newAlerts)
    } catch (error) {
      reportError(error instanceof Error ? error : new Error('Failed to refresh monitoring data'), {
        component: 'ErrorMonitoringDashboard',
        action: 'refreshData'
      })
    } finally {
      setLoading(false)
    }
  }, [reportError])

  // Auto-refresh effect
  useEffect(() => {
    refreshData()
    
    if (autoRefresh) {
      const interval = setInterval(refreshData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [refreshData, autoRefresh])

  // Get time range in milliseconds
  const getTimeRangeMs = useCallback((range: TimeRange): { start: number; end: number } => {
    const now = Date.now()
    const ranges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }
    return {
      start: now - ranges[range],
      end: now
    }
  }, [])

  // Get filtered errors
  const filteredErrors = useMemo(() => {
    const timeRangeMs = getTimeRangeMs(timeRange)
    return errorMonitoring.getErrors({
      category: selectedCategory || undefined,
      timeRange: timeRangeMs,
      limit: 100
    })
  }, [timeRange, selectedCategory, getTimeRangeMs, metrics]) // Include metrics to trigger refresh

  // Get insights
  const insights = useMemo(() => {
    try {
      return getErrorInsights()
    } catch (error) {
      reportError(error instanceof Error ? error : new Error('Failed to get error insights'), {
        component: 'ErrorMonitoringDashboard',
        action: 'getInsights'
      })
      return null
    }
  }, [metrics, alerts, reportError])

  // Handle alert dismissal
  const handleDismissAlert = useCallback((alertId: string) => {
    try {
      errorMonitoring.clearAlert(alertId)
      setAlerts(prev => prev.filter(alert => alert.id !== alertId))
    } catch (error) {
      reportError(error instanceof Error ? error : new Error('Failed to dismiss alert'), {
        component: 'ErrorMonitoringDashboard',
        action: 'handleDismissAlert',
        alertId
      })
    }
  }, [reportError])

  // Export data
  const handleExportData = useCallback((format: 'json' | 'csv') => {
    try {
      const data = errorMonitoring.exportErrors(format)
      const blob = new Blob([data], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `error-monitoring-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      reportError(error instanceof Error ? error : new Error('Failed to export data'), {
        component: 'ErrorMonitoringDashboard',
        action: 'handleExportData',
        format
      })
    }
  }, [reportError])

  // Clear all data
  const handleClearData = useCallback(() => {
    if (confirm('Are you sure you want to clear all monitoring data? This action cannot be undone.')) {
      try {
        errorMonitoring.clearData()
        refreshData()
      } catch (error) {
        reportError(error instanceof Error ? error : new Error('Failed to clear data'), {
          component: 'ErrorMonitoringDashboard',
          action: 'handleClearData'
        })
      }
    }
  }, [refreshData, reportError])

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
          component: 'ErrorMonitoringDashboard',
          viewMode,
          timeRange,
          errorInfo
        })
      }}
    >
      <div className={cn('space-y-6', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Error Monitoring</h1>
            <p className="text-white/60">Monitor application errors and system health</p>
          </div>
          
          <div className="flex items-center gap-3">
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
            
            <div className="flex gap-1">
              <Button onClick={() => handleExportData('json')} variant="ghost" size="sm">
                Export JSON
              </Button>
              <Button onClick={() => handleExportData('csv')} variant="ghost" size="sm">
                Export CSV
              </Button>
            </div>
            
            <Button onClick={handleClearData} variant="ghost" size="sm" className="text-error hover:text-error">
              Clear Data
            </Button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {(['1h', '24h', '7d', '30d'] as TimeRange[]).map((range) => (
            <Button
              key={range}
              onClick={() => setTimeRange(range)}
              variant={timeRange === range ? 'primary' : 'ghost'}
              size="sm"
            >
              {range === '1h' ? 'Last Hour' : 
               range === '24h' ? 'Last 24 Hours' :
               range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </Button>
          ))}
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 border-b border-surface-700">
          {(['overview', 'errors', 'alerts', 'trends'] as ViewMode[]).map((mode) => (
            <Button
              key={mode}
              onClick={() => setViewMode(mode)}
              variant={viewMode === mode ? 'primary' : 'ghost'}
              size="sm"
              className="rounded-b-none"
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Button>
          ))}
        </div>

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <Card className="p-4 bg-warning/10 border-warning/20">
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="font-semibold text-white">Active Alerts ({alerts.length})</h3>
            </div>
            
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-surface-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Chip 
                      variant={alert.type === 'critical' ? 'error' : alert.type === 'spike' ? 'warning' : 'info'}
                      size="sm"
                    >
                      {alert.type}
                    </Chip>
                    <span className="text-sm text-white">{alert.message}</span>
                    <span className="text-xs text-white/50">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <Button
                    onClick={() => handleDismissAlert(alert.id)}
                    variant="ghost"
                    size="sm"
                  >
                    Dismiss
                  </Button>
                </div>
              ))}
              
              {alerts.length > 3 && (
                <Button
                  onClick={() => setViewMode('alerts')}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  View All {alerts.length} Alerts
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Overview Mode */}
        {viewMode === 'overview' && metrics && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Total Errors</p>
                    <p className="text-2xl font-bold text-white">{metrics.totalErrors}</p>
                  </div>
                  <div className="w-12 h-12 bg-error/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Critical Errors</p>
                    <p className="text-2xl font-bold text-error">{metrics.errorsBySeverity.critical || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-error/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Active Alerts</p>
                    <p className="text-2xl font-bold text-warning">{alerts.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="15 17h5l-5 5v-5z" />
                    </svg>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Components Affected</p>
                    <p className="text-2xl font-bold text-info">{Object.keys(metrics.errorsByComponent).length}</p>
                  </div>
                  <div className="w-12 h-12 bg-info/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </Card>
            </div>

            {/* Error Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* By Category */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Errors by Category</h3>
                <div className="space-y-3">
                  {Object.entries(metrics.errorsByCategory)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([category, count]) => {
                      const percentage = (count / metrics.totalErrors) * 100
                      return (
                        <div key={category} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-white capitalize">{category}</span>
                            <span className="text-sm text-white/60">{count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                </div>
              </Card>
              
              {/* By Component */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Errors by Component</h3>
                <div className="space-y-3">
                  {Object.entries(metrics.errorsByComponent)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([component, count]) => {
                      const percentage = (count / metrics.totalErrors) * 100
                      return (
                        <div key={component} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-white">{component}</span>
                            <span className="text-sm text-white/60">{count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                </div>
              </Card>
            </div>

            {/* Top Errors */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Most Frequent Errors</h3>
              <div className="space-y-3">
                {metrics.topErrors.slice(0, 5).map((error, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-surface-800 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{error.message}</p>
                      <p className="text-xs text-white/50">
                        Last occurred: {new Date(error.lastOccurred).toLocaleString()}
                      </p>
                    </div>
                    <Chip variant="secondary" size="sm">
                      {error.count} times
                    </Chip>
                  </div>
                ))}
              </div>
            </Card>

            {/* Insights and Recommendations */}
            {insights && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Insights & Recommendations</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-surface-800 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{insights.summary.totalErrors}</p>
                      <p className="text-xs text-white/60">Total Errors</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-warning">{insights.summary.activeAlerts}</p>
                      <p className="text-xs text-white/60">Active Alerts</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-error">{insights.summary.criticalErrors}</p>
                      <p className="text-xs text-white/60">Critical Errors</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-info">{insights.summary.topErrorCategory}</p>
                      <p className="text-xs text-white/60">Top Category</p>
                    </div>
                  </div>
                  
                  {insights.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium text-white mb-2">Recommendations:</h4>
                      <ul className="space-y-1">
                        {insights.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-white/80 flex items-start gap-2">
                            <span className="text-info mt-1">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </>
        )}

        {/* Errors Mode */}
        {viewMode === 'errors' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Errors</h3>
              
              {/* Category Filter */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedCategory(null)}
                  variant={selectedCategory === null ? 'primary' : 'ghost'}
                  size="sm"
                >
                  All
                </Button>
                {metrics && Object.keys(metrics.errorsByCategory).map((category) => (
                  <Button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    variant={selectedCategory === category ? 'primary' : 'ghost'}
                    size="sm"
                  >
                    {category} ({metrics.errorsByCategory[category]})
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredErrors.map((error) => (
                <div key={error.id} className="p-4 bg-surface-800 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Chip 
                        variant={error.severity === 'critical' ? 'error' : 
                                error.severity === 'high' ? 'warning' : 'info'}
                        size="sm"
                      >
                        {error.severity}
                      </Chip>
                      <Chip variant="secondary" size="sm">
                        {error.category}
                      </Chip>
                      {error.context?.component && (
                        <Chip variant="ghost" size="sm">
                          {error.context.component}
                        </Chip>
                      )}
                    </div>
                    <span className="text-xs text-white/50">
                      {new Date(error.context?.timestamp || error.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-white mb-2">{error.message}</p>
                  
                  {error.stack && (
                    <details className="text-xs text-white/60">
                      <summary className="cursor-pointer hover:text-white/80">Stack trace</summary>
                      <pre className="mt-2 p-2 bg-surface-900 rounded text-xs overflow-x-auto">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
              
              {filteredErrors.length === 0 && (
                <div className="text-center py-8 text-white/60">
                  No errors found for the selected criteria.
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Alerts Mode */}
        {viewMode === 'alerts' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">All Alerts</h3>
            
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-4 bg-surface-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Chip 
                        variant={alert.type === 'critical' ? 'error' : 
                                alert.type === 'spike' ? 'warning' : 'info'}
                        size="sm"
                      >
                        {alert.type}
                      </Chip>
                      <span className="text-sm text-white">{alert.message}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/50">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                      <Button
                        onClick={() => handleDismissAlert(alert.id)}
                        variant="ghost"
                        size="sm"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                  
                  {alert.metadata && (
                    <details className="text-xs text-white/60">
                      <summary className="cursor-pointer hover:text-white/80">Alert details</summary>
                      <pre className="mt-2 p-2 bg-surface-900 rounded text-xs overflow-x-auto">
                        {JSON.stringify(alert.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
              
              {alerts.length === 0 && (
                <div className="text-center py-8 text-white/60">
                  No active alerts.
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Trends Mode */}
        {viewMode === 'trends' && metrics && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Error Trends</h3>
            
            <div className="space-y-6">
              {/* Trend Chart Placeholder */}
              <div className="h-64 bg-surface-800 rounded-lg flex items-center justify-center">
                <div className="text-center text-white/60">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p>Error trend visualization would be displayed here</p>
                  <p className="text-sm">Integration with charting library needed</p>
                </div>
              </div>
              
              {/* Trend Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {metrics.errorTrends.slice(-3).map((trend, index) => (
                  <div key={index} className="p-4 bg-surface-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/60">
                        {new Date(trend.timestamp).toLocaleTimeString()}
                      </span>
                      <Chip variant="secondary" size="sm">
                        {trend.count} errors
                      </Chip>
                    </div>
                    <p className="text-sm text-white">
                      Primary category: {trend.category}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default ErrorMonitoringDashboard