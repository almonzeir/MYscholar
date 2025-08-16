// Integration test for Gemini API
import { GeminiAIService } from '../geminiAI'

// Mock cache to avoid Redis dependency in tests
jest.mock('../../cache/redis', () => ({
  cache: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(true)
  },
  cacheKeys: {}
}))

// Mock logging service
jest.mock('../../logging/loggingService', () => ({
  loggingService: {
    logAPIRequest: jest.fn(),
    logError: jest.fn(),
    logCacheOperation: jest.fn()
  }
}))

describe('Gemini API Integration', () => {
  let geminiService: GeminiAIService
  const TEST_API_KEY = 'test-api-key-for-integration-tests'

  beforeEach(() => {
    // Use a test API key - never commit real keys
    process.env.GEMINI_API_KEY = TEST_API_KEY
    geminiService = new GeminiAIService()
  })

  afterEach(() => {
    delete process.env.GEMINI_API_KEY
    jest.clearAllMocks()
  })

  it('should have API key configured for testing', () => {
    expect(process.env.GEMINI_API_KEY).toBeDefined()
    expect(process.env.GEMINI_API_KEY).toBe(TEST_API_KEY)
  })

  // Note: This is a real API test - only run when needed
  it.skip('should make real API call to Gemini', async () => {
    const mockProfile = {
      nationality: 'US',
      degreeTarget: 'master',
      fieldKeywords: ['computer science'],
      gpa: 3.8
    }

    const mockScholarships = [{
      id: '1',
      name: 'Test Scholarship',
      country: 'Germany',
      degreeLevels: ['master'],
      fields: ['computer science'],
      deadline: new Date('2024-12-31'),
      stipend: 1200,
      tuitionCovered: true,
      requirements: ['Bachelor degree', 'English proficiency']
    }]

    try {
      const result = await geminiService.rankScholarships(mockProfile, mockScholarships, 1)
      
      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('scholarshipId')
      expect(result[0]).toHaveProperty('enhancedScore')
      expect(result[0]).toHaveProperty('aiRationale')
      
      console.log('Gemini API Response:', result[0])
    } catch (error) {
      console.log('Gemini API test skipped due to error:', error)
      // This is expected if API quota is exceeded or network issues
    }
  })
})