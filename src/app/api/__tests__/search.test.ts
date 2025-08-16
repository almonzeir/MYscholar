import { POST, GET } from '../search/route'
import { NextRequest } from 'next/server'

// Mock the cache module
jest.mock('../../../lib/cache/redis', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn()
  },
  cacheKeys: {
    searchResults: jest.fn((key: string) => `search:${key}`)
  }
}))

// Mock the Gemini AI service
jest.mock('../../../lib/services/geminiAI', () => ({
  GeminiAIService: jest.fn().mockImplementation(() => ({
    rankScholarships: jest.fn().mockResolvedValue([
      {
        scholarshipId: '1',
        enhancedScore: 95,
        aiRationale: 'Excellent match',
        matchStrengths: ['Field match'],
        applicationTips: ['Apply early'],
        potentialConcerns: []
      }
    ])
  }))
}))

describe('/api/search', () => {
  describe('POST', () => {
    it('should return search results successfully', async () => {
      const requestBody = {
        profile: {
          nationality: 'US',
          degreeTarget: 'master',
          fieldKeywords: ['computer science'],
          specialStatus: [],
          constraints: {}
        },
        filters: {},
        limit: 25,
        offset: 0
      }

      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('scholarships')
      expect(data.data).toHaveProperty('total')
      expect(data.data).toHaveProperty('processingTime')
    })

    it('should validate request data', async () => {
      const invalidRequestBody = {
        profile: {
          // Missing required fields
          nationality: 'US'
        }
      }

      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        body: JSON.stringify(invalidRequestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
      expect(data.details).toBeDefined()
    })

    it('should handle empty request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/search', {
        method: 'POST',
        body: '',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })

  describe('GET', () => {
    it('should return health check information', async () => {
      const request = new NextRequest('http://localhost:3000/api/search')
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy')
      expect(data.service).toBe('Scholarship Search')
      expect(data.features).toBeInstanceOf(Array)
    })
  })
})