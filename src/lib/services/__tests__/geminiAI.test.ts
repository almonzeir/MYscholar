import { geminiAI } from '../geminiAI'

// Mock fetch
global.fetch = jest.fn()

describe('geminiAI', () => {
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
    mockFetch.mockClear()
    
    // Mock environment variable
    process.env.GEMINI_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    delete process.env.GEMINI_API_KEY
  })

  describe('geminiNER', () => {

    it('should extract entities from CV text', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                degree: 'Master',
                field_keywords: ['Computer Science'],
                gpa: 3.8,
                work_years: 2,
                language_proofs: ['IELTS 7.0']
              })
            }]
          }
        }]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const result = await geminiAI.geminiNER('CV text')

      expect(result).toEqual({
        degree: 'Master',
        field_keywords: ['Computer Science'],
        gpa: 3.8,
        work_years: 2,
        language_proofs: ['IELTS 7.0']
      })
    })
  })
})