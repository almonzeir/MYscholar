import type { UserProfile, ProfileSearch } from '../../types/database'
import { BaseRepository } from './BaseRepository'
import { createHash } from 'crypto'

export interface CreateUserProfileData {
  nationality: string
  degreeTarget: string
  fieldKeywords: string[]
  specialStatus: string[]
  constraints: Record<string, any>
  gpa?: number
  languageTests?: Record<string, any>
  publications?: number
  workExperience?: number
}

export interface ProfileSearchData {
  profileId: string
  query: Record<string, any>
  results: Record<string, any>
  expiresAt: Date
}

export class UserProfileRepository extends BaseRepository {
  async findById(id: string): Promise<UserProfile | null> {
    try {
      return await this.db.userProfile.findUnique({
        where: { id },
        include: {
          searches: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      })
    } catch (error) {
      this.handleError(error, 'findById')
    }
  }

  async create(data: CreateUserProfileData): Promise<UserProfile> {
    try {
      return await this.db.userProfile.create({
        data
      })
    } catch (error) {
      this.handleError(error, 'create')
    }
  }

  async update(id: string, data: Partial<CreateUserProfileData>): Promise<UserProfile> {
    try {
      return await this.db.userProfile.update({
        where: { id },
        data
      })
    } catch (error) {
      this.handleError(error, 'update')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.userProfile.delete({
        where: { id }
      })
    } catch (error) {
      this.handleError(error, 'delete')
    }
  }

  // Profile Search Cache Methods
  async findCachedSearch(profileHash: string): Promise<ProfileSearch | null> {
    try {
      const currentDate = new Date()
      
      // Use the optimized composite index (cacheKey, expiresAt)
      return await this.db.profileSearch.findFirst({
        where: {
          cacheKey: profileHash,
          expiresAt: { gt: currentDate }
        },
        // Only select necessary fields for cache lookup
        select: {
          id: true,
          profileId: true,
          cacheKey: true,
          results: true,
          expiresAt: true,
          createdAt: true
        }
      })
    } catch (error) {
      this.handleError(error, 'findCachedSearch')
    }
  }

  async createSearchCache(data: ProfileSearchData): Promise<ProfileSearch> {
    try {
      const cacheKey = this.generateCacheKey(data.query)
      
      return await this.db.profileSearch.create({
        data: {
          ...data,
          cacheKey
        }
      })
    } catch (error) {
      this.handleError(error, 'createSearchCache')
    }
  }

  async updateSearchCache(cacheKey: string, results: Record<string, any>): Promise<ProfileSearch> {
    try {
      return await this.db.profileSearch.update({
        where: { cacheKey },
        data: { 
          results,
          createdAt: new Date() // Update timestamp
        }
      })
    } catch (error) {
      this.handleError(error, 'updateSearchCache')
    }
  }

  async cleanExpiredSearches(): Promise<number> {
    try {
      const currentDate = new Date()
      
      // Use the optimized expiresAt index for efficient cleanup
      const result = await this.db.profileSearch.deleteMany({
        where: {
          expiresAt: { lt: currentDate }
        }
      })
      return result.count
    } catch (error) {
      this.handleError(error, 'cleanExpiredSearches')
    }
  }

  // Batch cleanup method for large datasets
  async cleanExpiredSearchesBatch(batchSize: number = 1000): Promise<number> {
    try {
      const currentDate = new Date()
      let totalDeleted = 0
      
      while (true) {
        // Find expired searches in batches
        const expiredSearches = await this.db.profileSearch.findMany({
          where: {
            expiresAt: { lt: currentDate }
          },
          select: { id: true },
          take: batchSize
        })
        
        if (expiredSearches.length === 0) break
        
        // Delete the batch
        const result = await this.db.profileSearch.deleteMany({
          where: {
            id: { in: expiredSearches.map((s: any) => s.id) }
          }
        })
        
        totalDeleted += result.count
        
        // Break if we deleted fewer than the batch size (last batch)
        if (expiredSearches.length < batchSize) break
      }
      
      return totalDeleted
    } catch (error) {
      this.handleError(error, 'cleanExpiredSearchesBatch')
    }
  }

  async getProfileStats(): Promise<{
    totalProfiles: number
    profilesByNationality: Record<string, number>
    profilesByDegree: Record<string, number>
    averageGPA: number | null
  }> {
    try {
      const [
        totalProfiles,
        profiles,
        avgGPA
      ] = await Promise.all([
        this.db.userProfile.count(),
        this.db.userProfile.findMany({
          select: {
            nationality: true,
            degreeTarget: true,
            gpa: true
          }
        }),
        this.db.userProfile.aggregate({
          _avg: { gpa: true },
          where: { gpa: { not: null } }
        })
      ])

      const profilesByNationality: Record<string, number> = {}
      const profilesByDegree: Record<string, number> = {}

      profiles.forEach((profile: { nationality: string; degreeTarget: string; gpa: number | null }) => {
        profilesByNationality[profile.nationality] = (profilesByNationality[profile.nationality] || 0) + 1
        profilesByDegree[profile.degreeTarget] = (profilesByDegree[profile.degreeTarget] || 0) + 1
      })

      return {
        totalProfiles,
        profilesByNationality,
        profilesByDegree,
        averageGPA: avgGPA._avg.gpa
      }
    } catch (error) {
      this.handleError(error, 'getProfileStats')
    }
  }

  // Generate a consistent cache key for profile queries
  generateCacheKey(query: Record<string, any>): string {
    const normalizedQuery = JSON.stringify(query, Object.keys(query).sort())
    return createHash('sha256').update(normalizedQuery).digest('hex')
  }

  // Create a profile hash for caching search results
  createProfileHash(profile: UserProfile): string {
    const profileData = {
      nationality: profile.nationality,
      degreeTarget: profile.degreeTarget,
      fieldKeywords: profile.fieldKeywords.sort(),
      specialStatus: profile.specialStatus.sort(),
      gpa: profile.gpa,
      constraints: profile.constraints
    }
    
    return this.generateCacheKey(profileData)
  }
}