// Database types - these will be replaced by Prisma generated types once the database is set up

export interface Scholarship {
  id: string
  name: string
  sourceUrl: string
  domain: string
  country: string
  degreeLevels: string[]
  fields: string[]
  deadline: Date
  stipend?: number
  tuitionCovered: boolean
  travelSupport: boolean
  eligibilityText: string
  requirements: string[]
  tags: string[]
  confidence: number
  createdAt: Date
  updatedAt: Date
}

export interface UserProfile {
  id: string
  nationality: string
  degreeTarget: string
  fieldKeywords: string[]
  specialStatus: string[]
  constraints: Record<string, any>
  gpa?: number
  languageTests?: Record<string, any>
  publications?: number
  workExperience?: number
  createdAt: Date
  updatedAt: Date
}

export interface ProfileSearch {
  id: string
  profileId: string
  query: Record<string, any>
  results: Record<string, any>
  cacheKey: string
  createdAt: Date
  expiresAt: Date
}

// Prisma-like types for now
export interface ScholarshipWhereInput {
  AND?: ScholarshipWhereInput[]
  OR?: ScholarshipWhereInput[]
  id?: string
  name?: { contains?: string; mode?: 'insensitive' }
  country?: { in?: string[] }
  degreeLevels?: { hasSome?: string[] }
  fields?: { hasSome?: string[] }
  deadline?: { gte?: Date; lte?: Date }
  stipend?: { gte?: number }
  domain?: { in?: string[] }
  eligibilityText?: { contains?: string; mode?: 'insensitive' }
}

export interface ScholarshipOrderByWithRelationInput {
  deadline?: 'asc' | 'desc'
  createdAt?: 'asc' | 'desc'
  confidence?: 'asc' | 'desc'
  stipend?: 'asc' | 'desc'
}

export const DatabasePrisma = {
  ScholarshipWhereInput: {} as ScholarshipWhereInput,
  ScholarshipOrderByWithRelationInput: {} as ScholarshipOrderByWithRelationInput
}