import type { Scholarship, ScholarshipWhereInput, ScholarshipOrderByWithRelationInput } from '../../types/database'
import { Prisma } from '@prisma/client'

import { BaseRepository } from './BaseRepository'

export interface ScholarshipFilters {
  countries?: string[]
  degreeLevels?: string[]
  fields?: string[]
  deadlineBefore?: Date
  deadlineAfter?: Date
  minStipend?: number
  domains?: string[]
  search?: string
}

export interface ScholarshipSearchOptions {
  filters?: ScholarshipFilters
  limit?: number
  offset?: number
  orderBy?: ScholarshipOrderByWithRelationInput[]
}

export class ScholarshipRepository extends BaseRepository {
  async findById(id: string): Promise<Scholarship | null> {
    try {
      return await this.db.scholarship.findUnique({
        where: { id }
      })
    } catch (error) {
      this.handleError(error, 'findById')
    }
  }

  async findByUrl(sourceUrl: string): Promise<Scholarship | null> {
    try {
      return await this.db.scholarship.findUnique({
        where: { sourceUrl }
      })
    } catch (error) {
      this.handleError(error, 'findByUrl')
    }
  }

  async search(options: ScholarshipSearchOptions = {}): Promise<{
    scholarships: Scholarship[]
    total: number
  }> {
    try {
      const { filters, limit = 25, offset = 0, orderBy } = options
      
      const where: ScholarshipWhereInput = this.buildWhereClause(filters)
      
      // Optimize for large offsets by using cursor-based pagination when possible
      const optimizedOrderBy = orderBy || [{ deadline: 'asc' }, { confidence: 'desc' }]
      
      const [scholarships, total] = await Promise.all([
        this.db.scholarship.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: optimizedOrderBy,
          // Select only necessary fields for list view
          select: {
            id: true,
            name: true,
            sourceUrl: true,
            domain: true,
            country: true,
            degreeLevels: true,
            fields: true,
            deadline: true,
            stipend: true,
            tuitionCovered: true,
            travelSupport: true,
            confidence: true,
            createdAt: true,
            // Exclude large text fields from list queries
            eligibilityText: false,
            requirements: false,
            tags: true,
            updatedAt: false
          }
        }),
        // Only count when necessary (expensive operation)
        offset === 0 ? this.db.scholarship.count({ where }) : Promise.resolve(-1)
      ])

      return { 
        scholarships, 
        total: offset === 0 ? total : -1 // Return -1 for subsequent pages to avoid expensive count
      }
    } catch (error) {
      this.handleError(error, 'search')
    }
  }

  async findMatching(
    fieldKeywords: string[],
    degreeTarget: string,
    nationality: string,
    limit: number = 100
  ): Promise<Scholarship[]> {
    try {
      // Optimized query with better index utilization
      const currentDate = new Date()
      
      const where: ScholarshipWhereInput = {
        AND: [
          // Use indexed deadline field first for better performance
          { deadline: { gte: currentDate } },
          // Degree level match using array overlap
          { degreeLevels: { hasSome: [degreeTarget] } },
          // Optimized field matching - prioritize exact field matches
          fieldKeywords.length > 0 ? {
            OR: [
              // Prioritize exact field matches (uses GIN index)
              { fields: { hasSome: fieldKeywords } },
              // Fallback to text search only if needed
              ...fieldKeywords.slice(0, 3).map(keyword => ({
                OR: [
                  { name: { contains: keyword, mode: 'insensitive' as const } },
                  { eligibilityText: { contains: keyword, mode: 'insensitive' as const } }
                ]
              }))
            ]
          } : {},
          // Simplified nationality check for better performance
          {
            OR: [
              { eligibilityText: { contains: nationality, mode: 'insensitive' } },
              { eligibilityText: { contains: 'international', mode: 'insensitive' } }
            ]
          }
        ]
      }

      // Use optimized ordering that leverages indexes
      return await this.db.scholarship.findMany({
        where,
        take: limit,
        orderBy: [
          { confidence: 'desc' },
          { deadline: 'asc' }
        ],
        // Only select necessary fields to reduce data transfer
        select: {
          id: true,
          name: true,
          sourceUrl: true,
          domain: true,
          country: true,
          degreeLevels: true,
          fields: true,
          deadline: true,
          stipend: true,
          tuitionCovered: true,
          travelSupport: true,
          eligibilityText: true,
          requirements: true,
          tags: true,
          confidence: true,
          createdAt: true,
          updatedAt: true
        }
      })
    } catch (error) {
      this.handleError(error, 'findMatching')
    }
  }

  async create(data: Omit<Scholarship, 'id' | 'createdAt' | 'updatedAt'>): Promise<Scholarship> {
    try {
      return await this.db.scholarship.create({
        data
      })
    } catch (error) {
      this.handleError(error, 'create')
    }
  }

  async update(id: string, data: Partial<Omit<Scholarship, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Scholarship> {
    try {
      return await this.db.scholarship.update({
        where: { id },
        data
      })
    } catch (error) {
      this.handleError(error, 'update')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.scholarship.delete({
        where: { id }
      })
    } catch (error) {
      this.handleError(error, 'delete')
    }
  }

  async bulkCreate(scholarships: Omit<Scholarship, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<number> {
    try {
      const result = await this.db.scholarship.createMany({
        data: scholarships,
        skipDuplicates: true
      })
      return result.count
    } catch (error) {
      this.handleError(error, 'bulkCreate')
    }
  }

  async getStats(): Promise<{
    total: number
    byCountry: Record<string, number>
    byDegreeLevel: Record<string, number>
    upcomingDeadlines: number
  }> {
    try {
      const [
        total,
        scholarships,
        upcomingDeadlines
      ] = await Promise.all([
        this.db.scholarship.count(),
        this.db.scholarship.findMany({
          select: {
            country: true,
            degreeLevels: true
          }
        }),
        this.db.scholarship.count({
          where: {
            deadline: {
              gte: new Date(),
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            }
          }
        })
      ])

      const byCountry: Record<string, number> = {}
      const byDegreeLevel: Record<string, number> = {}

      scholarships.forEach((scholarship: { country: string; degreeLevels: string[] }) => {
        byCountry[scholarship.country] = (byCountry[scholarship.country] || 0) + 1
        scholarship.degreeLevels.forEach((level: string) => {
          byDegreeLevel[level] = (byDegreeLevel[level] || 0) + 1
        })
      })

      return {
        total,
        byCountry,
        byDegreeLevel,
        upcomingDeadlines
      }
    } catch (error) {
      this.handleError(error, 'getStats')
    }
  }

  private buildWhereClause(filters?: ScholarshipFilters): ScholarshipWhereInput {
    if (!filters) return {}

    const conditions: ScholarshipWhereInput[] = []

    if (filters.countries?.length) {
      conditions.push({ country: { in: filters.countries } })
    }

    if (filters.degreeLevels?.length) {
      conditions.push({ degreeLevels: { hasSome: filters.degreeLevels } })
    }

    if (filters.fields?.length) {
      conditions.push({ fields: { hasSome: filters.fields } })
    }

    if (filters.deadlineBefore) {
      conditions.push({ deadline: { lte: filters.deadlineBefore } })
    }

    if (filters.deadlineAfter) {
      conditions.push({ deadline: { gte: filters.deadlineAfter } })
    }

    if (filters.minStipend) {
      conditions.push({ stipend: { gte: filters.minStipend } })
    }

    if (filters.domains?.length) {
      conditions.push({ domain: { in: filters.domains } })
    }

    if (filters.search) {
      conditions.push({
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { eligibilityText: { contains: filters.search, mode: 'insensitive' } },
          { fields: { hasSome: [filters.search] } }
        ]
      })
    }

    return conditions.length > 0 ? { AND: conditions } : {}
  }
}