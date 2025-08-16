// Gemini AI service for advanced scholarship matching and ranking
// This service uses Google's Gemini 1.5 Flash for intelligent scholarship recommendations

import { logger } from '../utils/logger'
import { cache, cacheKeys } from '../cache/redis'
import { loggingService } from '../logging/loggingService'

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string
    }>
  }>
  generationConfig?: {
    temperature?: number
    topK?: number
    topP?: number
    maxOutputTokens?: number
  }
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
    finishReason: string
    index: number
  }>
  usageMetadata?: {
    promptTokenCount: number
    candidatesTokenCount: number
    totalTokenCount: number
  }
}

interface ScholarshipRankingResult {
  scholarshipId: string
  enhancedScore: number
  aiRationale: string
  matchStrengths: string[]
  potentialConcerns: string[]
  applicationTips: string[]
}

interface RateLimitInfo {
  requestCount: number
  resetTime: number
  windowStart: number
}

interface UsageStats {
  requestsToday: number
  tokensUsed: number
  remainingQuota: number
  lastUpdated: Date
}

export class GeminiAIService {
  private apiKey: string
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent'
  private rateLimitKey = 'gemini:rate_limit'
  private usageStatsKey = 'gemini:usage_stats'
  private maxRequestsPerMinute = 60
  private maxTokensPerDay = 1000000

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || ''
    
    if (!this.apiKey) {
      logger.warn('Gemini API key not configured')
    }
  }

  async rankScholarships(
    userProfile: any,
    scholarships: any[],
    limit: number = 25
  ): Promise<ScholarshipRankingResult[]> {
    if (!this.apiKey) {
      throw new Error('Gemini API not configured')
    }

    const startTime = Date.now()
    
    try {
      // Generate cache key based on profile and scholarships
      const cacheKey = this.generateCacheKey('ranking', userProfile, scholarships, limit)
      
      // Check cache first
      const cachedResult = await cache.get<ScholarshipRankingResult[]>(cacheKey)
      if (cachedResult) {
        await loggingService.logCacheOperation({
          operation: 'hit',
          key: cacheKey,
          service: 'gemini',
          responseTime: Date.now() - startTime
        })
        return cachedResult
      }

      // Check rate limits
      await this.checkRateLimit()

      // Create a comprehensive prompt for scholarship ranking
      const prompt = this.buildRankingPrompt(userProfile, scholarships)
      
      const response = await this.callGeminiAPI(prompt, {
        temperature: 0.3, // Lower temperature for more consistent ranking
        maxOutputTokens: Math.min(4000, scholarships.length * 200), // Dynamic token allocation
        topP: 0.8
      })

      // Parse the AI response and extract rankings
      const rankings = this.parseRankingResponse(response, scholarships)
      const limitedRankings = rankings.slice(0, limit)
      
      // Cache the result for 30 minutes
      await cache.set(cacheKey, limitedRankings, { ttl: 1800 })
      
      // Update usage stats
      await this.updateUsageStats(response.usageMetadata)
      
      // Log the operation
      await loggingService.logAPIRequest({
        service: 'gemini',
        endpoint: 'rankScholarships',
        method: 'POST',
        responseTime: Date.now() - startTime,
        statusCode: 200,
        requestSize: prompt.length,
        responseSize: JSON.stringify(limitedRankings).length,
        metadata: {
          scholarshipCount: scholarships.length,
          tokensUsed: response.usageMetadata?.totalTokenCount || 0
        }
      })
      
      return limitedRankings

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      await loggingService.logError({
        error: error instanceof Error ? error : new Error(errorMessage),
        context: {
          service: 'gemini',
          operation: 'rankScholarships',
          scholarshipCount: scholarships.length,
          userProfile: this.sanitizeProfile(userProfile)
        },
        severity: 'medium'
      })
      
      logger.error('Gemini ranking failed', error instanceof Error ? error : new Error(errorMessage))
      
      // Fallback to basic ranking if AI fails
      return this.fallbackRanking(scholarships, limit)
    }
  }

  async generatePersonalizedRecommendations(
    userProfile: any,
    topScholarships: any[]
  ): Promise<{
    summary: string
    recommendations: Array<{
      scholarshipId: string
      personalizedMessage: string
      actionItems: string[]
      timeline: string
    }>
  }> {
    if (!this.apiKey) {
      throw new Error('Gemini API not configured')
    }

    try {
      const prompt = this.buildRecommendationPrompt(userProfile, topScholarships)
      
      const response = await this.callGeminiAPI(prompt, {
        temperature: 0.7, // Higher temperature for more creative recommendations
        maxOutputTokens: 3000
      })

      return this.parseRecommendationResponse(response, topScholarships)

    } catch (error) {
      logger.error('Gemini recommendation failed', error instanceof Error ? error : new Error(String(error)))
      return this.fallbackRecommendations(topScholarships)
    }
  }

  async enhanceScholarshipDescription(
    scholarship: any,
    userProfile: any
  ): Promise<{
    enhancedDescription: string
    personalizedHighlights: string[]
    applicationStrategy: string
  }> {
    if (!this.apiKey) {
      throw new Error('Gemini API not configured')
    }

    try {
      const prompt = `
        Analyze this scholarship opportunity for a specific student profile and provide personalized insights:

        SCHOLARSHIP:
        Name: ${scholarship.name}
        Country: ${scholarship.country}
        Degree Levels: ${scholarship.degreeLevels.join(', ')}
        Fields: ${scholarship.fields.join(', ')}
        Deadline: ${scholarship.deadline}
        Stipend: ${scholarship.stipend ? `€${scholarship.stipend}/month` : 'Not specified'}
        Tuition Covered: ${scholarship.tuitionCovered ? 'Yes' : 'No'}
        Requirements: ${scholarship.requirements.join(', ')}
        Eligibility: ${scholarship.eligibilityText}

        STUDENT PROFILE:
        Nationality: ${userProfile.nationality}
        Target Degree: ${userProfile.degreeTarget}
        Field Keywords: ${userProfile.fieldKeywords.join(', ')}
        GPA: ${userProfile.gpa || 'Not provided'}
        Publications: ${userProfile.publications || 0}
        Work Experience: ${userProfile.workExperience || 0} months

        Please provide:
        1. An enhanced, personalized description of why this scholarship is relevant
        2. Key highlights that match the student's profile
        3. A strategic approach for the application

        Format as JSON:
        {
          "enhancedDescription": "...",
          "personalizedHighlights": ["...", "..."],
          "applicationStrategy": "..."
        }
      `

      const response = await this.callGeminiAPI(prompt, {
        temperature: 0.5,
        maxOutputTokens: 2000
      })

      return this.parseEnhancementResponse(response)

    } catch (error) {
      logger.error('Gemini enhancement failed', error instanceof Error ? error : new Error(String(error)))
      return this.fallbackEnhancement(scholarship)
    }
  }

  private async callGeminiAPI(
    prompt: string,
    config: {
      temperature?: number
      topK?: number
      topP?: number
      maxOutputTokens?: number
    } = {}
  ): Promise<GeminiResponse> {
    const request: GeminiRequest = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: config.temperature || 0.7,
        topK: config.topK || 40,
        topP: config.topP || 0.95,
        maxOutputTokens: config.maxOutputTokens || 2048
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MYscholar/1.0'
        },
        body: JSON.stringify(request),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Handle specific error types
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.')
        }
        if (response.status === 403) {
          throw new Error('API key invalid or quota exceeded.')
        }
        
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - Gemini API took too long to respond')
      }
      
      throw error
    }
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now()
    const windowDuration = 60 * 1000 // 1 minute
    
    const rateLimitInfo = await cache.get<RateLimitInfo>(this.rateLimitKey)
    
    if (!rateLimitInfo) {
      // Initialize rate limit tracking
      await cache.set(this.rateLimitKey, {
        requestCount: 1,
        resetTime: now + windowDuration,
        windowStart: now
      }, { ttl: 60 })
      return
    }
    
    // Check if window has expired
    if (now >= rateLimitInfo.resetTime) {
      await cache.set(this.rateLimitKey, {
        requestCount: 1,
        resetTime: now + windowDuration,
        windowStart: now
      }, { ttl: 60 })
      return
    }
    
    // Check if we've exceeded the limit
    if (rateLimitInfo.requestCount >= this.maxRequestsPerMinute) {
      const waitTime = rateLimitInfo.resetTime - now
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`)
    }
    
    // Increment counter
    await cache.set(this.rateLimitKey, {
      ...rateLimitInfo,
      requestCount: rateLimitInfo.requestCount + 1
    }, { ttl: Math.ceil((rateLimitInfo.resetTime - now) / 1000) })
  }

  private generateCacheKey(operation: string, userProfile: any, scholarships: any[], limit?: number): string {
    const profileHash = this.hashObject({
      nationality: userProfile.nationality,
      degreeTarget: userProfile.degreeTarget,
      fieldKeywords: userProfile.fieldKeywords?.sort(),
      gpa: userProfile.gpa,
      specialStatus: userProfile.specialStatus?.sort()
    })
    
    const scholarshipIds = scholarships.map(s => s.id || s.name).sort().join(',')
    const scholarshipHash = this.hashString(scholarshipIds)
    
    return `gemini:${operation}:${profileHash}:${scholarshipHash}:${limit || 'all'}`
  }

  private hashObject(obj: any): string {
    return this.hashString(JSON.stringify(obj))
  }

  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  private sanitizeProfile(profile: any): any {
    // Remove sensitive information from profile for logging
    const { personalInfo, ...sanitized } = profile
    return {
      ...sanitized,
      nationality: profile.nationality,
      degreeTarget: profile.degreeTarget,
      fieldCount: profile.fieldKeywords?.length || 0
    }
  }

  private async updateUsageStats(usageMetadata?: { totalTokenCount?: number }): Promise<void> {
    if (!usageMetadata?.totalTokenCount) return
    
    const today = new Date().toISOString().split('T')[0]
    const statsKey = `${this.usageStatsKey}:${today}`
    
    const currentStats = await cache.get<UsageStats>(statsKey) || {
      requestsToday: 0,
      tokensUsed: 0,
      remainingQuota: this.maxTokensPerDay,
      lastUpdated: new Date()
    }
    
    const updatedStats: UsageStats = {
      requestsToday: currentStats.requestsToday + 1,
      tokensUsed: currentStats.tokensUsed + usageMetadata.totalTokenCount,
      remainingQuota: this.maxTokensPerDay - (currentStats.tokensUsed + usageMetadata.totalTokenCount),
      lastUpdated: new Date()
    }
    
    // Cache until end of day
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const ttl = Math.floor((tomorrow.getTime() - Date.now()) / 1000)
    
    await cache.set(statsKey, updatedStats, { ttl })
  }

  private buildRankingPrompt(userProfile: any, scholarships: any[]): string {
    // Optimize prompt length while maintaining quality
    const profileSummary = this.buildProfileSummary(userProfile)
    const scholarshipSummaries = this.buildScholarshipSummaries(scholarships)
    
    return `You are an expert scholarship advisor. Rank scholarships for this student profile and provide analysis.

STUDENT: ${profileSummary}

SCHOLARSHIPS:
${scholarshipSummaries}

Rank from best to worst match. For each, provide:
- Enhanced score (0-100)
- Rationale (2-3 sentences)
- Match strengths (2-3 key points)
- Concerns (1-2 potential issues)
- Application tips (2-3 actionable items)

Respond with valid JSON array:
[{"scholarshipId":"1","enhancedScore":95,"aiRationale":"...","matchStrengths":["..."],"potentialConcerns":["..."],"applicationTips":["..."]}]`
  }

  private buildProfileSummary(profile: any): string {
    const parts = [
      `${profile.nationality} student`,
      `seeking ${profile.degreeTarget}`,
      `in ${profile.fieldKeywords?.slice(0, 3).join(', ') || 'general field'}`
    ]
    
    if (profile.gpa) parts.push(`GPA: ${profile.gpa}`)
    if (profile.publications > 0) parts.push(`${profile.publications} publications`)
    if (profile.workExperience > 0) parts.push(`${Math.floor(profile.workExperience / 12)}y experience`)
    if (profile.specialStatus?.length) parts.push(`Status: ${profile.specialStatus.slice(0, 2).join(', ')}`)
    
    return parts.join(', ')
  }

  private buildScholarshipSummaries(scholarships: any[]): string {
    return scholarships.map((s, i) => {
      const funding = s.tuitionCovered ? 'Full funding' : (s.stipend ? `€${s.stipend}/mo` : 'Partial')
      const fields = s.fields?.slice(0, 2).join(', ') || 'General'
      const levels = s.degreeLevels?.join(', ') || 'Various'
      
      return `${i + 1}. ${s.name} (${s.country}) - ${funding}, ${levels}, ${fields}, Due: ${s.deadline}`
    }).join('\n')
  }

  private buildRecommendationPrompt(userProfile: any, scholarships: any[]): string {
    return `
      Create personalized scholarship recommendations for this student:

      STUDENT PROFILE:
      - Nationality: ${userProfile.nationality}
      - Target Degree: ${userProfile.degreeTarget}
      - Field: ${userProfile.fieldKeywords.join(', ')}
      - GPA: ${userProfile.gpa || 'Not provided'}

      TOP SCHOLARSHIPS:
      ${scholarships.map((s, i) => `${i + 1}. ${s.name} (${s.country})`).join('\n')}

      Provide:
      1. Overall summary of opportunities
      2. Personalized message for each scholarship
      3. Action items for applications
      4. Timeline recommendations

      Format as JSON:
      {
        "summary": "...",
        "recommendations": [
          {
            "scholarshipId": "1",
            "personalizedMessage": "...",
            "actionItems": ["...", "..."],
            "timeline": "..."
          }
        ]
      }
    `
  }

  private parseRankingResponse(response: GeminiResponse, scholarships: any[]): ScholarshipRankingResult[] {
    try {
      const text = response.candidates[0]?.content?.parts[0]?.text || ''
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const rankings = JSON.parse(jsonMatch[0])
      
      return rankings.map((ranking: any) => ({
        scholarshipId: ranking.scholarshipId,
        enhancedScore: ranking.enhancedScore || 50,
        aiRationale: ranking.aiRationale || 'AI analysis unavailable',
        matchStrengths: ranking.matchStrengths || [],
        potentialConcerns: ranking.potentialConcerns || [],
        applicationTips: ranking.applicationTips || []
      }))

    } catch (error) {
      logger.error('Failed to parse Gemini ranking response', error instanceof Error ? error : new Error(String(error)))
      return this.fallbackRanking(scholarships, scholarships.length)
    }
  }

  private parseRecommendationResponse(response: GeminiResponse, scholarships: any[]) {
    try {
      const text = response.candidates[0]?.content?.parts[0]?.text || ''
      
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      return JSON.parse(jsonMatch[0])

    } catch (error) {
      logger.error('Failed to parse Gemini recommendation response', error instanceof Error ? error : new Error(String(error)))
      return this.fallbackRecommendations(scholarships)
    }
  }

  private parseEnhancementResponse(response: GeminiResponse) {
    try {
      const text = response.candidates[0]?.content?.parts[0]?.text || ''
      
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      return JSON.parse(jsonMatch[0])

    } catch (error) {
      logger.error('Failed to parse Gemini enhancement response', error instanceof Error ? error : new Error(String(error)))
      return {
        enhancedDescription: 'Enhanced description unavailable',
        personalizedHighlights: ['Match analysis unavailable'],
        applicationStrategy: 'Application strategy unavailable'
      }
    }
  }

  private fallbackRanking(scholarships: any[], limit: number): ScholarshipRankingResult[] {
    return scholarships.slice(0, limit).map((scholarship, index) => ({
      scholarshipId: scholarship.id,
      enhancedScore: Math.max(50, 90 - index * 5), // Decreasing scores
      aiRationale: 'AI ranking temporarily unavailable. Using basic compatibility scoring.',
      matchStrengths: ['Basic compatibility match'],
      potentialConcerns: ['AI analysis unavailable'],
      applicationTips: ['Review requirements carefully', 'Prepare application materials early']
    }))
  }

  private fallbackRecommendations(scholarships: any[]) {
    return {
      summary: 'We found several scholarship opportunities that match your profile. AI-powered personalization is temporarily unavailable.',
      recommendations: scholarships.map(scholarship => ({
        scholarshipId: scholarship.id,
        personalizedMessage: `${scholarship.name} appears to be a good match for your academic background.`,
        actionItems: ['Review eligibility requirements', 'Prepare application documents', 'Note the deadline'],
        timeline: 'Start application process as soon as possible'
      }))
    }
  }

  private fallbackEnhancement(scholarship: any) {
    return {
      enhancedDescription: `${scholarship.name} is a ${scholarship.tuitionCovered ? 'fully-funded' : 'partially-funded'} scholarship opportunity in ${scholarship.country}.`,
      personalizedHighlights: [
        `Covers ${scholarship.degreeLevels.join(' and ')} degrees`,
        `Available for ${scholarship.fields.join(', ')} fields`
      ],
      applicationStrategy: 'Review all requirements carefully and prepare a strong application highlighting your relevant experience and academic achievements.'
    }
  }

  // Get API usage statistics
  async getUsageStats(): Promise<{
    requestsToday: number
    tokensUsed: number
    remainingQuota: number
    rateLimitStatus: {
      requestsThisMinute: number
      maxRequestsPerMinute: number
      resetTime: Date
    }
  }> {
    const today = new Date().toISOString().split('T')[0]
    const statsKey = `${this.usageStatsKey}:${today}`
    
    const currentStats = await cache.get<UsageStats>(statsKey) || {
      requestsToday: 0,
      tokensUsed: 0,
      remainingQuota: this.maxTokensPerDay,
      lastUpdated: new Date()
    }
    
    const rateLimitInfo = await cache.get<RateLimitInfo>(this.rateLimitKey) || {
      requestCount: 0,
      resetTime: Date.now() + 60000,
      windowStart: Date.now()
    }
    
    return {
      requestsToday: currentStats.requestsToday,
      tokensUsed: currentStats.tokensUsed,
      remainingQuota: Math.max(0, currentStats.remainingQuota),
      rateLimitStatus: {
        requestsThisMinute: rateLimitInfo.requestCount,
        maxRequestsPerMinute: this.maxRequestsPerMinute,
        resetTime: new Date(rateLimitInfo.resetTime)
      }
    }
  }

  // Health check method
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    apiKeyConfigured: boolean
    rateLimitOk: boolean
    quotaAvailable: boolean
    lastError?: string
  }> {
    const stats = await this.getUsageStats()
    
    const apiKeyConfigured = !!this.apiKey
    const rateLimitOk = stats.rateLimitStatus.requestsThisMinute < stats.rateLimitStatus.maxRequestsPerMinute
    const quotaAvailable = stats.remainingQuota > 1000 // At least 1000 tokens remaining
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    
    if (!apiKeyConfigured) {
      status = 'unhealthy'
    } else if (!rateLimitOk || !quotaAvailable) {
      status = 'degraded'
    }
    
    return {
      status,
      apiKeyConfigured,
      rateLimitOk,
      quotaAvailable
    }
  }
}