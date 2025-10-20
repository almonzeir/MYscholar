import { GET } from '../search/route'
import { NextRequest, NextResponse } from 'next/server'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data) => ({
      json: () => Promise.resolve(data),
      status: 200,
    })),
  },
  NextRequest: jest.fn((url) => ({
    url,
    nextUrl: {
      origin: 'http://localhost:3000'
    }
  }))
}));


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
  geminiAI: {
    geminiExtract: jest.fn().mockResolvedValue({
      id: '1',
      name: 'Global Excellence Scholarship',
      country: 'Canada',
      degree_levels: ['Master', 'PhD'],
      fields: ['Computer Science', 'Engineering'],
      deadline: '2024-12-31',
      source_domain: 'example.com',
      updatedAt: new Date().toISOString(),
    }),
  },
}))

describe('/api/search', () => {
  describe('GET', () => {
    it('should return health check information', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ data: { domains: [] } }),
        })
      ) as jest.Mock;

      const request = new NextRequest('http://localhost:3000/api/search')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
    })
  })
})