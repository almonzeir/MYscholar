// Database types - these will be replaced by Prisma generated types once the database is set up

export interface Scholarship {
  id: string
  name: string
  sourceUrl: string
  domain: string
  country: string
  degreeLevels: string[]
  fields: string[]
  deadline: Date | 'varies' // Updated to include 'varies'
  stipend?: number
  tuitionCovered: boolean
  travelSupport: boolean
  eligibilityText: string
  requirements: string[]
  tags: string[]
  confidence: number
  createdAt: Date
  updatedAt: Date
  // Added eligibility_rules based on specification
  eligibility_rules?: Array<{
    rule: string;
    value?: any;
    allowed?: string[];
    values?: string[];
    optional?: boolean;
    scale?: string;
  }>;
}

