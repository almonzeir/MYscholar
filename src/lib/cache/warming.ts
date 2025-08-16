import { cache, cacheKeys, cacheTags } from './redis'
import { logger } from '../utils/logger'

interface WarmupTask {
  key: string
  data: any
  ttl?: number
  tags?: string[]
  priority: 'high' | 'medium' | 'low'
}

interface WarmupResult {
  success: number
  failed: number
  skipped: number
  totalTime: number
  errors: string[]
}

// Cache warming service
export class CacheWarmingService {
  private isWarming = false
  private warmupQueue: WarmupTask[] = []
  
  constructor() {
    // Auto-warm cache on startup if in production
    if (process.env.NODE_ENV === 'production') {
      this.scheduleAutoWarmup()
    }
  }
  
  // Add task to warmup queue
  addWarmupTask(task: WarmupTask): void {
    this.warmupQueue.push(task)
    
    // Sort by priority
    this.warmupQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }
  
  // Warm up essential application data
  async warmupEssentials(): Promise<WarmupResult> {
    const startTime = Date.now()
    const result: WarmupResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      totalTime: 0,
      errors: []
    }
    
    if (this.isWarming) {
      logger.warn('Cache warming already in progress, skipping')
      return result
    }
    
    this.isWarming = true
    logger.info('Starting cache warmup for essential data')
    
    try {
      // Essential data to warm up
      const essentialTasks: WarmupTask[] = [
        {
          key: cacheKeys.api.countries(),
          data: await this.getCountriesData(),
          ttl: 3600, // 1 hour
          tags: [cacheTags.PUBLIC_DATA, cacheTags.API],
          priority: 'high'
        },
        {
          key: cacheKeys.api.fields(),
          data: await this.getFieldsData(),
          ttl: 3600,
          tags: [cacheTags.PUBLIC_DATA, cacheTags.API],
          priority: 'high'
        },
        {
          key: cacheKeys.scholarship.featured(),
          data: await this.getFeaturedScholarships(),
          ttl: 1800, // 30 minutes
          tags: [cacheTags.SCHOLARSHIPS, cacheTags.PUBLIC_DATA],
          priority: 'high'
        },
        {
          key: cacheKeys.stats.scholarships(),
          data: await this.getScholarshipStats(),
          ttl: 300, // 5 minutes
          tags: [cacheTags.STATS, cacheTags.PUBLIC_DATA],
          priority: 'medium'
        },
        {
          key: cacheKeys.api.universities(),
          data: await this.getUniversitiesData(),
          ttl: 7200, // 2 hours
          tags: [cacheTags.PUBLIC_DATA, cacheTags.API],
          priority: 'medium'
        }
      ]
      
      // Process essential tasks
      for (const task of essentialTasks) {
        try {
          await cache.set(task.key, task.data, {
            ttl: task.ttl,
            tags: task.tags
          })
          result.success++
          logger.debug(`Warmed up cache for key: ${task.key}`)
        } catch (error) {
          result.failed++
          const errorMsg = `Failed to warm up ${task.key}: ${error instanceof Error ? error.message : 'Unknown error'}`
          result.errors.push(errorMsg)
          logger.error(errorMsg)
        }
      }
      
    } catch (error) {
      logger.error('Cache warmup failed', error instanceof Error ? error : new Error(String(error)))
      result.failed++
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      this.isWarming = false
      result.totalTime = Date.now() - startTime
      
      logger.info('Cache warmup completed', {
        success: result.success,
        failed: result.failed,
        totalTime: result.totalTime
      })
    }
    
    return result
  }
  
  // Process warmup queue
  async processWarmupQueue(): Promise<WarmupResult> {
    const startTime = Date.now()
    const result: WarmupResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      totalTime: 0,
      errors: []
    }
    
    if (this.warmupQueue.length === 0) {
      logger.info('No tasks in warmup queue')
      return result
    }
    
    logger.info(`Processing ${this.warmupQueue.length} warmup tasks`)
    
    while (this.warmupQueue.length > 0) {
      const task = this.warmupQueue.shift()!
      
      try {
        // Check if already cached
        const existing = await cache.get(task.key)
        if (existing) {
          result.skipped++
          logger.debug(`Skipped warming ${task.key} - already cached`)
          continue
        }
        
        await cache.set(task.key, task.data, {
          ttl: task.ttl,
          tags: task.tags
        })
        
        result.success++
        logger.debug(`Warmed up cache for key: ${task.key}`)
        
      } catch (error) {
        result.failed++
        const errorMsg = `Failed to warm up ${task.key}: ${error instanceof Error ? error.message : 'Unknown error'}`
        result.errors.push(errorMsg)
        logger.error(errorMsg)
      }
    }
    
    result.totalTime = Date.now() - startTime
    
    logger.info('Warmup queue processed', {
      success: result.success,
      failed: result.failed,
      skipped: result.skipped,
      totalTime: result.totalTime
    })
    
    return result
  }
  
  // Schedule automatic warmup
  private scheduleAutoWarmup(): void {
    // Warm up on startup
    setTimeout(() => {
      this.warmupEssentials().catch(error => {
        logger.error('Auto warmup failed', error)
      })
    }, 5000) // Wait 5 seconds after startup
    
    // Schedule periodic warmup every hour
    setInterval(() => {
      this.warmupEssentials().catch(error => {
        logger.error('Scheduled warmup failed', error)
      })
    }, 60 * 60 * 1000) // Every hour
  }
  
  // Data fetching methods (these would typically call your repositories)
  private async getCountriesData(): Promise<string[]> {
    // In a real implementation, this would fetch from database
    return [
      'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
      'France', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Switzerland',
      'Japan', 'South Korea', 'Singapore', 'New Zealand', 'Austria',
      'Belgium', 'Finland', 'Ireland', 'Italy', 'Spain', 'Portugal'
    ]
  }
  
  private async getFieldsData(): Promise<string[]> {
    return [
      'Computer Science', 'Engineering', 'Medicine', 'Business Administration',
      'Natural Sciences', 'Social Sciences', 'Arts and Humanities',
      'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Psychology',
      'Economics', 'Law', 'Education', 'Environmental Science',
      'Public Health', 'International Relations', 'Architecture', 'Design'
    ]
  }
  
  private async getFeaturedScholarships(): Promise<any[]> {
    // This would typically fetch featured scholarships from database
    return [
      {
        id: 'featured-1',
        name: 'Rhodes Scholarships',
        country: 'United Kingdom',
        deadline: new Date('2024-10-01'),
        featured: true
      },
      {
        id: 'featured-2',
        name: 'Fulbright Program',
        country: 'United States',
        deadline: new Date('2024-10-15'),
        featured: true
      }
    ]
  }
  
  private async getScholarshipStats(): Promise<any> {
    return {
      total: 1250,
      active: 890,
      countries: 45,
      fields: 25,
      lastUpdated: new Date().toISOString()
    }
  }
  
  private async getUniversitiesData(): Promise<string[]> {
    return [
      'Harvard University', 'MIT', 'Stanford University', 'Oxford University',
      'Cambridge University', 'ETH Zurich', 'University of Toronto',
      'Australian National University', 'University of Tokyo',
      'National University of Singapore', 'Technical University of Munich',
      'Sorbonne University', 'University of Amsterdam', 'KTH Royal Institute'
    ]
  }
  
  // Get warmup status
  getStatus(): { isWarming: boolean; queueLength: number } {
    return {
      isWarming: this.isWarming,
      queueLength: this.warmupQueue.length
    }
  }
}

// Export singleton instance
export const cacheWarmingService = new CacheWarmingService()