import { GeminiAIService } from '../geminiAI'

// Mock fetch
global.fetch = jest.fn()

describe('GeminiAIService', () => {
  let geminiService: GeminiAIService
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>

  const mockProfile = {
    nationality: 'US',
    degreeTarget: 'master',
    fieldKeywords: ['computer science'],
    gpa: 3.8
  }

  const mockScholarships = [
    {
      id: '1',
      name: 'Test Scholarship',
      country: 'Germany',
      degreeLevels: ['master'],
      fields: ['computer science']
    }
  ]

  beforeEach(() => {
    geminiService = new GeminiAIService()
    mockFetch.mockClear()
    
    // Mock environment variable
    process.env.GEMINI_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    delete process.env.GEMINI_API_KEY
  })

  describe('rankScholarships', () => {

    it('should rank scholarships successfully', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify([{
                scholarshipId: '1',
                enhancedScore: 95,
                aiRationale: 'Excellent match',
                matchStrengths: ['Field match', 'Degree match'],
                potentialConcerns: [],
                applicationTips: ['Apply early']
              }])
            }]
          }
        }]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const result = await geminiService.rankScholarships(mockProfile, mockScholarships)

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        scholarshipId: '1',
        enhancedScore: 95,
        aiRationale: 'Excellent match'
      })
    })

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'))

      const result = await geminiService.rankScholarships(mockProfile, mockScholarships)

      // Should return fallback ranking
      expect(result).toHaveLength(1)
      expect(result[0].aiRationale).toContain('temporarily unavailable')
    })

    it('should throw error when API key is missing', async () => {
      delete process.env.GEMINI_API_KEY
      const newService = new GeminiAIService()

      await expect(
        newService.rankScholarships(mockProfile, mockScholarships)
      ).rejects.toThrow('Gemini API not configured')
    })
  })

  describe('generatePersonalizedRecommendations', () => {
    it('should generate recommendations successfully', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                summary: 'Great opportunities found',
                recommendations: [{
                  scholarshipId: '1',
                  personalizedMessage: 'Perfect match for you',
                  actionItems: ['Prepare documents'],
                  timeline: 'Apply by next month'
                }]
              })
            }]
          }
        }]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const result = await geminiService.generatePersonalizedRecommendations(
        mockProfile,
        mockScholarships
      )

      expect(result.summary).toBe('Great opportunities found')
      expect(result.recommendations).toHaveLength(1)
    })
  })

  describe('getUsageStats', () => {
    it('should return usage statistics', async () => {
      const stats = await geminiService.getUsageStats()

      expect(stats).toHaveProperty('requestsToday')
      expect(stats).toHaveProperty('tokensUsed')
      expect(stats).toHaveProperty('remainingQuota')
      expect(typeof stats.requestsToday).toBe('number')
    })
  })
})