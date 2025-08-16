// Core type definitions for the scholarship platform

export interface Scholarship {
  id: string;
  name: string;
  sourceUrl: string;
  domain: string;
  country: string;
  degreeLevels: DegreeLevel[];
  fields: string[];
  deadline: Date;
  stipend?: number;
  tuitionCovered: boolean;
  travelSupport: boolean;
  eligibilityText: string;
  requirements: string[];
  tags: string[];
  updatedAt: Date;
  confidence: number;
}

export interface UserProfile {
  id?: string;
  nationality: string;
  degreeTarget: DegreeLevel;
  fieldKeywords: string[];
  specialStatus: SpecialStatus[];
  constraints: ProfileConstraint[];
  gpa?: number;
  languageTests?: LanguageTest[];
  publications?: number;
  workExperience?: number;
  createdAt: Date;
}

export interface RankedScholarship extends Scholarship {
  matchScore: number;
  matchReasons: string[];
  llmRationale?: string;
}

export interface ProcessingStage {
  name: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  startTime?: Date;
  endTime?: Date;
  progress: number;
}

export type DegreeLevel = 'bachelor' | 'master' | 'phd' | 'postdoc';

export type SpecialStatus = 'first-generation' | 'minority' | 'disability' | 'veteran' | 'refugee';

export interface ProfileConstraint {
  type: 'location' | 'budget' | 'timeline' | 'language';
  value: string;
}

export interface LanguageTest {
  type: 'TOEFL' | 'IELTS' | 'GRE' | 'GMAT';
  score: number;
  date: Date;
}

export interface SearchFilters {
  countries?: string[];
  degreeLevels?: DegreeLevel[];
  deadlineBefore?: Date;
  minStipend?: number;
  fields?: string[];
}

export interface SearchRequest {
  profile: UserProfile;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
}

export interface SearchResponse {
  scholarships: RankedScholarship[];
  total: number;
  processingTime: number;
  cacheHit: boolean;
}