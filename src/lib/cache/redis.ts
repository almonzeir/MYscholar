// Enhanced cache implementation with better strategies
// This will be used for caching search results, session data, and API responses

interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Cache tags for invalidation
}

interface CacheItem {
  value: any
  expires: number
  tags: string[]
  hits: number
  lastAccessed: number
  size: number
}

class MemoryCache {
  private cache = new Map<string, CacheItem>()
  private maxSize = 1000 // Maximum number of cache entries
  private maxMemory = 100 * 1024 * 1024 // 100MB max memory usage
  private currentMemory = 0
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key)
    
    if (!item) {
      this.stats.misses++
      return null
    }
    
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      this.currentMemory -= item.size
      this.stats.misses++
      return null
    }
    
    // Update access statistics
    item.hits++
    item.lastAccessed = Date.now()
    this.stats.hits++
    
    return item.value as T
  }

  async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || this.getDefaultTTL(key)
    const expires = Date.now() + (ttl * 1000)
    const tags = options.tags || []
    const size = this.estimateSize(value)
    
    // Check if we need to evict items
    await this.evictIfNeeded(size)
    
    const existingItem = this.cache.get(key)
    if (existingItem) {
      this.currentMemory -= existingItem.size
    }
    
    const item: CacheItem = {
      value,
      expires,
      tags,
      hits: 0,
      lastAccessed: Date.now(),
      size
    }
    
    this.cache.set(key, item)
    this.currentMemory += size
    this.stats.sets++
  }

  async del(key: string): Promise<void> {
    const item = this.cache.get(key)
    if (item) {
      this.currentMemory -= item.size
      this.stats.deletes++
    }
    this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
    this.currentMemory = 0
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0, evictions: 0 }
  }

  // Invalidate cache entries by tags
  async invalidateByTags(tags: string[]): Promise<number> {
    let invalidated = 0
    const entries = Array.from(this.cache.entries())
    
    for (const [key, item] of entries) {
      if (item.tags.some(tag => tags.includes(tag))) {
        await this.del(key)
        invalidated++
      }
    }
    
    return invalidated
  }

  // Get cache statistics
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : '0.00'
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
      maxSize: this.maxSize,
      memoryUsage: `${(this.currentMemory / 1024 / 1024).toFixed(2)}MB`,
      maxMemory: `${(this.maxMemory / 1024 / 1024).toFixed(2)}MB`
    }
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    const entries = Array.from(this.cache.entries())
    let cleaned = 0
    
    for (const [key, item] of entries) {
      if (now > item.expires) {
        this.cache.delete(key)
        this.currentMemory -= item.size
        cleaned++
      }
    }
    
    if (cleaned > 0) {
      console.log(`Cache cleanup: removed ${cleaned} expired entries`)
    }
  }

  // Evict items if cache is full or memory limit exceeded
  private async evictIfNeeded(newItemSize: number): Promise<void> {
    // Check size limit
    if (this.cache.size >= this.maxSize) {
      await this.evictLRU(1)
    }
    
    // Check memory limit
    if (this.currentMemory + newItemSize > this.maxMemory) {
      const targetMemory = this.maxMemory * 0.8 // Evict to 80% capacity
      await this.evictToMemoryTarget(targetMemory)
    }
  }

  // Evict least recently used items
  private async evictLRU(count: number): Promise<void> {
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
    
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      await this.del(entries[i][0])
      this.stats.evictions++
    }
  }

  // Evict items to reach target memory usage
  private async evictToMemoryTarget(targetMemory: number): Promise<void> {
    const entries = Array.from(this.cache.entries())
    // Sort by access frequency and recency (LFU + LRU hybrid)
    entries.sort((a, b) => {
      const scoreA = a[1].hits / (Date.now() - a[1].lastAccessed + 1)
      const scoreB = b[1].hits / (Date.now() - b[1].lastAccessed + 1)
      return scoreA - scoreB
    })
    
    for (const [key] of entries) {
      if (this.currentMemory <= targetMemory) break
      await this.del(key)
      this.stats.evictions++
    }
  }

  // Estimate memory size of a value
  private estimateSize(value: any): number {
    try {
      return JSON.stringify(value).length * 2 // Rough estimate (UTF-16)
    } catch {
      return 1024 // Default size for non-serializable objects
    }
  }

  // Get default TTL based on key pattern
  private getDefaultTTL(key: string): number {
    if (key.startsWith('search:')) return 600 // 10 minutes for search results
    if (key.startsWith('scholarship:')) return 3600 // 1 hour for scholarship details
    if (key.startsWith('profile:')) return 1800 // 30 minutes for user profiles
    if (key.startsWith('stats:')) return 300 // 5 minutes for statistics
    return 600 // Default 10 minutes
  }
}

// For development, use in-memory cache
// In production, this would be replaced with Redis
export const cache = new MemoryCache()

// Cleanup expired entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    cache.cleanup()
  }, 5 * 60 * 1000)
}

// Enhanced cache key generators with better organization
export const cacheKeys = {
  // Search-related caches
  search: {
    results: (profileHash: string) => `search:results:${profileHash}`,
    filters: (userId: string) => `search:filters:${userId}`,
    history: (userId: string) => `search:history:${userId}`,
    suggestions: (query: string) => `search:suggestions:${Buffer.from(query).toString('base64')}`
  },
  
  // Scholarship-related caches
  scholarship: {
    details: (id: string) => `scholarship:details:${id}`,
    list: (filters: string) => `scholarship:list:${filters}`,
    featured: () => 'scholarship:featured',
    trending: () => 'scholarship:trending',
    byCountry: (country: string) => `scholarship:country:${country}`,
    byField: (field: string) => `scholarship:field:${field}`,
    deadlines: (month: string) => `scholarship:deadlines:${month}`
  },
  
  // User profile caches
  profile: {
    details: (id: string) => `profile:details:${id}`,
    preferences: (id: string) => `profile:preferences:${id}`,
    applications: (id: string) => `profile:applications:${id}`,
    recommendations: (id: string) => `profile:recommendations:${id}`,
    activity: (id: string) => `profile:activity:${id}`
  },
  
  // Statistics and analytics
  stats: {
    scholarships: () => 'stats:scholarships',
    profiles: () => 'stats:profiles',
    searches: () => 'stats:searches',
    applications: () => 'stats:applications',
    daily: (date: string) => `stats:daily:${date}`,
    monthly: (month: string) => `stats:monthly:${month}`
  },
  
  // API response caches
  api: {
    health: () => 'api:health',
    config: () => 'api:config',
    countries: () => 'api:countries',
    fields: () => 'api:fields',
    universities: () => 'api:universities'
  },
  
  // AI and ML caches
  ai: {
    recommendations: (profileId: string) => `ai:recommendations:${profileId}`,
    rankings: (searchId: string) => `ai:rankings:${searchId}`,
    embeddings: (text: string) => `ai:embeddings:${Buffer.from(text).toString('base64').slice(0, 50)}`,
    analysis: (documentId: string) => `ai:analysis:${documentId}`
  },
  
  // Session and authentication
  session: {
    user: (sessionId: string) => `session:user:${sessionId}`,
    admin: (sessionId: string) => `session:admin:${sessionId}`,
    temp: (token: string) => `session:temp:${token}`
  },
  
  // Rate limiting
  rateLimit: {
    api: (ip: string, endpoint: string) => `rate:api:${ip}:${endpoint}`,
    search: (userId: string) => `rate:search:${userId}`,
    upload: (userId: string) => `rate:upload:${userId}`
  }
}

// Cache tag constants for invalidation
export const cacheTags = {
  SCHOLARSHIPS: 'scholarships',
  PROFILES: 'profiles',
  SEARCH: 'search',
  STATS: 'stats',
  AI: 'ai',
  USER_DATA: 'user_data',
  PUBLIC_DATA: 'public_data',
  ADMIN_DATA: 'admin_data'
}