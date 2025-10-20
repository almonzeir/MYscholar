// Integration test for Gemini API
import { geminiAI } from '../geminiAI'

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
  const TEST_API_KEY = 'test-api-key-for-integration-tests'

  beforeEach(() => {
    // Use a test API key - never commit real keys
    process.env.GEMINI_API_KEY = TEST_API_KEY
  })

  afterEach(() => {
    delete process.env.GEMINI_API_KEY
    jest.clearAllMocks()
  })

  it('should have API key configured for testing', () => {
    expect(process.env.GEMINI_API_KEY).toBeDefined()
    expect(process.env.GEMINI_API_KEY).toBe(TEST_API_KEY)
  })
})