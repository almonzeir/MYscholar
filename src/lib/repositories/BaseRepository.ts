import { PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export abstract class BaseRepository {
  protected db: PrismaClient

  constructor() {
    this.db = prisma
  }

  protected handleError(error: unknown, operation: string): never {
    console.error(`Repository error in ${operation}:`, error)
    
    if (error instanceof Error) {
      throw new Error(`Database operation failed: ${error.message}`)
    }
    
    throw new Error(`Unknown database error in ${operation}`)
  }
}