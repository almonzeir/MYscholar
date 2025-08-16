# Design Document

## Overview

The Scholarship Platform is a modern, responsive web application built with Next.js 14 (App Router), TypeScript, and Tailwind CSS. The architecture follows a layered approach with clear separation between presentation, business logic, and data layers. The system emphasizes performance through streaming responses, intelligent caching, and progressive enhancement while maintaining a premium 3D visual experience with the orange/brown brand identity.

## Architecture

### Frontend Architecture
- **Framework**: Next.js 14 with App Router for optimal performance and SEO
- **Language**: TypeScript with strict mode for type safety
- **Styling**: Tailwind CSS with custom orange/brown theme configuration
- **State Management**: Server Actions for data fetching, React state for UI interactions
- **Performance**: Streaming SSR, incremental static regeneration, and edge caching

### Backend Architecture
- **API Layer**: Next.js API routes with OpenAPI specification
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations
- **Caching**: Redis for session data and search result caching
- **Background Jobs**: Queue system for data ingestion and processing
- **External APIs**: Google Programmable Search, Gemini 1.5 Flash for LLM ranking

### Infrastructure
- **Hosting**: Vercel for web application and edge functions
- **Database**: Neon PostgreSQL for managed database
- **Cache**: Upstash Redis for serverless caching
- **CDN**: Vercel Edge Network for global content delivery
- **Monitoring**: Built-in Vercel analytics and custom metrics

## Components and Interfaces

### Core Components

#### Landing Page Components
```typescript
// Hero section with 3D visual effects
interface HeroSectionProps {
  onUploadCV: (file: File) => void;
  onStartQuestionnaire: () => void;
}

// 3D background with layered depth
interface Background3DProps {
  reducedMotion: boolean;
  deviceCapability: 'high' | 'medium' | 'low';
}
```

#### Profile Creation Components
```typescript
// CV upload with drag-and-drop
interface CVUploadProps {
  onFileSelect: (file: File) => void;
  onParseComplete: (profile: UserProfile) => void;
  maxFileSize: number;
  acceptedTypes: string[];
}

// Guided questionnaire with step navigation
interface QuestionnaireProps {
  steps: QuestionStep[];
  onComplete: (profile: UserProfile) => void;
  onStepChange: (step: number) => void;
}
```

#### Search Results Components
```typescript
// Results grid with filtering
interface ResultsGridProps {
  scholarships: Scholarship[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  loading: boolean;
}

// Individual scholarship card with 3D effects
interface ScholarshipCardProps {
  scholarship: Scholarship;
  onSelect: (id: string) => void;
  variant: 'grid' | 'list';
}

// Real-time progress indicator
interface ProgressIndicatorProps {
  stages: ProcessingStage[];
  currentStage: string;
  progress: number;
}
```

#### Admin Components
```typescript
// Admin dashboard with metrics
interface AdminDashboardProps {
  metrics: PlatformMetrics;
  recentActivity: Activity[];
  alerts: Alert[];
}

// Scholarship management interface
interface ScholarshipManagerProps {
  scholarships: Scholarship[];
  onUpdate: (scholarship: Scholarship) => void;
  onDelete: (id: string) => void;
  reviewQueue: ReviewItem[];
}
```

### API Interfaces

#### Search API
```typescript
interface SearchRequest {
  profile: UserProfile;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
}

interface SearchResponse {
  scholarships: RankedScholarship[];
  total: number;
  processingTime: number;
  cacheHit: boolean;
}
```

#### CV Processing API
```typescript
interface CVParseRequest {
  file: File;
  extractionOptions: ExtractionOptions;
}

interface CVParseResponse {
  profile: UserProfile;
  confidence: number;
  extractedFields: ExtractedField[];
  suggestions: string[];
}
```

## Data Models

### Core Entities

#### Scholarship Model
```typescript
interface Scholarship {
  id: string;
  name: string;
  sourceUrl: string;
  domain: string;
  country: string;
  degreelevels: DegreeLevel[];
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
```

#### User Profile Model
```typescript
interface UserProfile {
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
```

#### Processing Models
```typescript
interface ProcessingStage {
  name: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  startTime?: Date;
  endTime?: Date;
  progress: number;
}

interface RankedScholarship extends Scholarship {
  matchScore: number;
  matchReasons: string[];
  llmRationale?: string;
}
```

### Database Schema (Prisma)
```prisma
model Scholarship {
  id              String   @id @default(cuid())
  name            String
  sourceUrl       String   @unique
  domain          String
  country         String
  degreeLevels    String[]
  fields          String[]
  deadline        DateTime
  stipend         Int?
  tuitionCovered  Boolean  @default(false)
  travelSupport   Boolean  @default(false)
  eligibilityText String
  requirements    String[]
  tags            String[]
  confidence      Float    @default(1.0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([country, deadline])
  @@index([fields])
}

model UserProfile {
  id             String   @id @default(cuid())
  nationality    String
  degreeTarget   String
  fieldKeywords  String[]
  specialStatus  String[]
  constraints    Json
  gpa            Float?
  languageTests  Json?
  publications   Int?
  workExperience Int?
  createdAt      DateTime @default(now())
  
  searches ProfileSearch[]
}

model ProfileSearch {
  id        String      @id @default(cuid())
  profileId String
  query     Json
  results   Json
  createdAt DateTime    @default(now())
  
  profile   UserProfile @relation(fields: [profileId], references: [id])
}
```

## Error Handling

### Client-Side Error Handling
- **Network Errors**: Retry logic with exponential backoff
- **Validation Errors**: Real-time form validation with clear error messages
- **File Upload Errors**: Progress indicators and detailed error descriptions
- **Search Errors**: Graceful degradation with cached results when available

### Server-Side Error Handling
- **API Errors**: Structured error responses with error codes and messages
- **Database Errors**: Connection pooling and automatic retry mechanisms
- **External API Failures**: Circuit breaker pattern for third-party services
- **Processing Errors**: Queue-based retry system for background jobs

### Error Recovery Strategies
```typescript
interface ErrorBoundaryProps {
  fallback: React.ComponentType<{error: Error}>;
  onError: (error: Error, errorInfo: ErrorInfo) => void;
}

interface RetryConfig {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelay: number;
}
```

## Testing Strategy

### Unit Testing
- **Components**: React Testing Library for component behavior
- **Utilities**: Jest for pure function testing
- **API Routes**: Supertest for endpoint testing
- **Database**: In-memory SQLite for isolated tests

### Integration Testing
- **User Flows**: Playwright for end-to-end testing
- **API Integration**: Test database with realistic data
- **External Services**: Mock services for reliable testing

### Performance Testing
- **Load Testing**: Artillery for API endpoint stress testing
- **Frontend Performance**: Lighthouse CI in build pipeline
- **Database Performance**: Query analysis and optimization

### Testing Configuration
```typescript
// Jest configuration for comprehensive testing
interface TestConfig {
  testEnvironment: 'jsdom' | 'node';
  setupFilesAfterEnv: string[];
  moduleNameMapping: Record<string, string>;
  collectCoverageFrom: string[];
  coverageThreshold: {
    global: {
      branches: number;
      functions: number;
      lines: number;
      statements: number;
    };
  };
}
```

## Performance Optimizations

### Frontend Performance
- **Code Splitting**: Dynamic imports for route-based splitting
- **Image Optimization**: Next.js Image component with WebP/AVIF
- **Font Optimization**: Self-hosted fonts with font-display: swap
- **Bundle Analysis**: Webpack Bundle Analyzer for size monitoring

### Backend Performance
- **Database Optimization**: Indexed queries and connection pooling
- **Caching Strategy**: Multi-layer caching (Redis, CDN, browser)
- **API Optimization**: Response compression and efficient serialization
- **Background Processing**: Queue-based processing for heavy operations

### 3D Visual Performance
- **GPU Optimization**: CSS transforms over JavaScript animations
- **Reduced Motion**: Respect user preferences for accessibility
- **Progressive Enhancement**: Fallback to 2D for low-power devices
- **Memory Management**: Cleanup of animation resources

## Security Considerations

### Authentication & Authorization
- **Anonymous Access**: Rate-limited access for free tier
- **Premium Authentication**: JWT-based authentication for paid features
- **Admin Access**: Role-based access control with email domain verification

### Data Protection
- **Input Validation**: Zod schemas for all user inputs
- **SQL Injection Prevention**: Parameterized queries through Prisma
- **XSS Protection**: Content Security Policy and input sanitization
- **CSRF Protection**: Built-in Next.js CSRF protection

### External Integrations
- **API Key Security**: Server-side only, never exposed to client
- **URL Validation**: Allowlist-based validation for external links
- **Rate Limiting**: Per-IP and per-user rate limiting
- **Content Filtering**: Automated content moderation for user inputs