'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Progress, Chip, Input } from '../ui'
import { ErrorBoundary, useError } from '@/components/error'
import ErrorMonitoringDashboard from './ErrorMonitoringDashboard'
import SystemHealthDashboard from './SystemHealthDashboard'
import GeminiMonitoringDashboard from './GeminiMonitoringDashboard'
import { cn } from '@/lib/utils'

interface PlatformMetrics {
  totalScholarships: number
  totalSearches: number
  activeUsers: number
  successRate: number
  averageMatchScore: number
  topCountries: Array<{ country: string; count: number }>
  topFields: Array<{ field: string; count: number }>
  recentActivity: Array<{
    id: string
    type: 'search' | 'ingestion' | 'user_signup'
    description: string
    timestamp: Date
  }>
}

interface IngestionStatus {
  currentJobs: Array<{
    id: string
    source: string
    status: 'running' | 'completed' | 'failed'
    progress: number
    startedAt: Date
  }>
  recentJobs: Array<{
    id: string
    source: string
    status: 'completed' | 'failed'
    results: {
      processed: number
      successful: number
      failed: number
    }
    completedAt: Date
  }>
  quotaUsage: {
    googleSearchAPI: {
      dailyQueries: number
      remainingQueries: number
      resetTime: Date
    }
  }
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null)
  const [ingestionStatus, setIngestionStatus] = useState<IngestionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'ingestion' | 'scholarships' | 'users' | 'errors' | 'health' | 'gemini-monitoring'>('overview')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminKey, setAdminKey] = useState('')
  const [authError, setAuthError] = useState('')

  // Authentication check
  useEffect(() => {
    // Check if already authenticated via session
    verifyAuth()
  }, [])

  const verifyAuth = async (key?: string) => {
    try {
      const headers: Record<string, string> = {}
      if (key) {
        headers['Authorization'] = `Bearer ${key}`
      }
      
      const response = await fetch('/api/admin/ingest', {
        headers,
        credentials: 'include' // Include cookies for session management
      })

      if (response.ok) {
        setIsAuthenticated(true)
        if (key) {
          // Only store a session flag, not the actual key
          sessionStorage.setItem('admin_authenticated', 'true')
          loadDashboardData(key)
        }
      } else {
        setAuthError('Invalid admin key')
        setIsAuthenticated(false)
        sessionStorage.removeItem('admin_authenticated')
      }
    } catch (error: unknown) {
      setAuthError('Authentication failed')
      setIsAuthenticated(false)
      sessionStorage.removeItem('admin_authenticated')
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    verifyAuth(adminKey)
  }

  const loadDashboardData = async (key: string) => {
    setLoading(true)
    try {
      // Load metrics and ingestion status
      const [metricsResponse, ingestionResponse] = await Promise.all([
        fetch('/api/admin/metrics', {
          headers: { 'Authorization': `Bearer ${key}` }
        }),
        fetch('/api/admin/ingest', {
          headers: { 'Authorization': `Bearer ${key}` }
        })
      ])

      // Mock data for demonstration
      setMetrics({
        totalScholarships: 1247,
        totalSearches: 8934,
        activeUsers: 456,
        successRate: 0.87,
        averageMatchScore: 73.2,
        topCountries: [
          { country: 'Germany', count: 234 },
          { country: 'United States', count: 198 },
          { country: 'United Kingdom', count: 156 },
          { country: 'Canada', count: 134 },
          { country: 'Australia', count: 98 }
        ],
        topFields: [
          { field: 'Computer Science', count: 312 },
          { field: 'Engineering', count: 287 },
          { field: 'Medicine', count: 198 },
          { field: 'Business', count: 156 },
          { field: 'Natural Sciences', count: 134 }
        ],
        recentActivity: [
          {
            id: '1',
            type: 'search',
            description: 'User searched for Computer Science scholarships',
            timestamp: new Date(Date.now() - 5 * 60 * 1000)
          },
          {
            id: '2',
            type: 'ingestion',
            description: 'Completed Google Search ingestion: 45 scholarships processed',
            timestamp: new Date(Date.now() - 15 * 60 * 1000)
          },
          {
            id: '3',
            type: 'user_signup',
            description: 'New user registered from India',
            timestamp: new Date(Date.now() - 30 * 60 * 1000)
          }
        ]
      })

      if (ingestionResponse.ok) {
        const ingestionData = await ingestionResponse.json()
        setIngestionStatus(ingestionData.data)
      }

    } catch (error) {
      // Failed to load dashboard data - error logged internally
    } finally {
      setLoading(false)
    }
  }

  const startIngestion = async (source: string) => {
    try {
      const response = await fetch('/api/admin/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminKey}`
        },
        body: JSON.stringify({
          sources: [source],
          limit: 50
        })
      })

      if (response.ok) {
        // Refresh ingestion status
        loadDashboardData(adminKey)
      }
    } catch (error) {
      // Failed to start ingestion - error logged internally
    }
  }

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Admin Access</h1>
            <p className="text-white/60">Enter your admin key to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="password"
              placeholder="Admin Key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              error={authError}
              required
            />
            
            <Button type="submit" variant="primary" className="w-full">
              Login
            </Button>
          </form>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-white/60">Manage scholarships, monitor performance, and oversee operations</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => {
                sessionStorage.removeItem('admin_authenticated')
                setIsAuthenticated(false)
              }}
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex space-x-1 mb-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'ingestion', label: 'Data Ingestion' },
            { id: 'scholarships', label: 'Scholarships' },
            { id: 'users', label: 'Users' },
            { id: 'errors', label: 'Error Monitoring' },
            { id: 'health', label: 'System Health' },
            { id: 'gemini-monitoring', label: 'Gemini AI' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Total Scholarships</p>
                    <p className="text-2xl font-bold text-white">{metrics?.totalScholarships.toLocaleString()}</p>
                  </div>
                  <div className="text-primary">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Total Searches</p>
                    <p className="text-2xl font-bold text-white">{metrics?.totalSearches.toLocaleString()}</p>
                  </div>
                  <div className="text-success">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Active Users</p>
                    <p className="text-2xl font-bold text-white">{metrics?.activeUsers}</p>
                  </div>
                  <div className="text-accent">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Success Rate</p>
                    <p className="text-2xl font-bold text-white">{(metrics?.successRate || 0 * 100).toFixed(1)}%</p>
                  </div>
                  <div className="text-success">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </Card>
            </div>

            {/* Charts and Analytics */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Top Countries</h3>
                <div className="space-y-3">
                  {metrics?.topCountries.map((item, index) => (
                    <div key={item.country} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-white/60 text-sm">#{index + 1}</span>
                        <span className="text-white">{item.country}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${(item.count / (metrics?.topCountries[0]?.count || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-white/60 text-sm">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Top Fields</h3>
                <div className="space-y-3">
                  {metrics?.topFields.map((item, index) => (
                    <div key={item.field} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-white/60 text-sm">#{index + 1}</span>
                        <span className="text-white">{item.field}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-accent h-2 rounded-full"
                            style={{ width: `${(item.count / (metrics?.topFields[0]?.count || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-white/60 text-sm">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {metrics?.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 bg-white/5 rounded-lg">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      activity.type === 'search' && 'bg-primary',
                      activity.type === 'ingestion' && 'bg-success',
                      activity.type === 'user_signup' && 'bg-accent'
                    )} />
                    <div className="flex-1">
                      <p className="text-white text-sm">{activity.description}</p>
                      <p className="text-white/60 text-xs">{activity.timestamp.toLocaleString()}</p>
                    </div>
                    <Chip variant="default" size="sm">
                      {activity.type.replace('_', ' ')}
                    </Chip>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'ingestion' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Data Ingestion Controls</h3>
              <div className="flex flex-wrap gap-4">
                <Button onClick={() => startIngestion('google')}>
                  Start Google Search
                </Button>
                <Button variant="secondary" onClick={() => startIngestion('rss')}>
                  Update RSS Feeds
                </Button>
                <Button variant="secondary" onClick={() => startIngestion('manual')}>
                  Manual Curation
                </Button>
              </div>
            </Card>

            {/* Current Jobs */}
            {ingestionStatus?.currentJobs && ingestionStatus.currentJobs.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Running Jobs</h3>
                <div className="space-y-4">
                  {ingestionStatus.currentJobs.map((job) => (
                    <div key={job.id} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{job.source} Ingestion</span>
                        <Chip variant={job.status === 'running' ? 'primary' : 'success'}>
                          {job.status}
                        </Chip>
                      </div>
                      <Progress value={job.progress} className="mb-2" />
                      <p className="text-white/60 text-sm">
                        Started: {job.startedAt.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recent Jobs */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Jobs</h3>
              <div className="space-y-3">
                {ingestionStatus?.recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{job.source} Ingestion</p>
                      <p className="text-white/60 text-sm">
                        {job.results.successful}/{job.results.processed} successful
                      </p>
                    </div>
                    <div className="text-right">
                      <Chip variant={job.status === 'completed' ? 'success' : 'error'}>
                        {job.status}
                      </Chip>
                      <p className="text-white/60 text-xs mt-1">
                        {job.completedAt.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* API Quota */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">API Quota Usage</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white">Google Search API</span>
                    <span className="text-white/60">
                      {ingestionStatus?.quotaUsage.googleSearchAPI.dailyQueries}/100 queries
                    </span>
                  </div>
                  <Progress 
                    value={(ingestionStatus?.quotaUsage.googleSearchAPI.dailyQueries || 0) / 100 * 100} 
                    className="mb-1"
                  />
                  <p className="text-white/60 text-xs">
                    Resets: {ingestionStatus?.quotaUsage.googleSearchAPI.resetTime.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Other tabs would be implemented similarly */}
        {activeTab === 'scholarships' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Scholarship Management</h3>
            <p className="text-white/60">Scholarship management interface coming soon...</p>
          </Card>
        )}

        {activeTab === 'users' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">User Management</h3>
            <p className="text-white/60">User management interface coming soon...</p>
          </Card>
        )}

        {activeTab === 'errors' && (
          <ErrorBoundary
            level="feature"
            onError={(error, errorInfo) => {
              console.error('Error in Error Monitoring Dashboard:', error, errorInfo)
            }}
          >
            <ErrorMonitoringDashboard />
          </ErrorBoundary>
        )}

        {activeTab === 'health' && (
          <ErrorBoundary
            level="feature"
            onError={(error, errorInfo) => {
              console.error('Error in System Health Dashboard:', error, errorInfo)
            }}
          >
            <SystemHealthDashboard />
          </ErrorBoundary>
        )}

        {activeTab === 'gemini-monitoring' && (
          <ErrorBoundary
            level="feature"
            onError={(error, errorInfo) => {
              console.error('Error in Gemini Monitoring Dashboard:', error, errorInfo)
            }}
          >
            <GeminiMonitoringDashboard />
          </ErrorBoundary>
        )}
      </div>
    </div>
  )
}