import { Scholarship } from '@/types/database';

/**
 * Normalizes extracted scholarship data to conform to the Scholarship interface.
 * This function ensures data consistency and handles any necessary transformations.
 * @param extractedData - The data extracted by Gemini.
 * @returns A normalized Scholarship object.
 */
export function normalizeScholarship(extractedData: any): Scholarship {
  // This is a placeholder for more complex normalization logic.
  // It assumes extractedData is already close to the Scholarship interface.
  // In a real scenario, you would add more robust validation and transformation here.

  const normalized: Scholarship = {
    id: extractedData.id || `sch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: extractedData.name || 'Untitled Scholarship',
    sourceUrl: extractedData.link || '', // Assuming 'link' from extracted data maps to sourceUrl
    domain: extractedData.source_domain || new URL(extractedData.link || 'http://example.com').hostname,
    country: extractedData.country || 'Unknown',
    degreeLevels: extractedData.degree_levels || [],
    fields: extractedData.fields || [],
    deadline: (() => {
      if (extractedData.deadline === 'varies') {
        return 'varies';
      }
      const date = new Date(extractedData.deadline);
      // Reject deadlines in the past
      if (isNaN(date.getTime()) || date.getTime() < Date.now()) {
        return 'varies'; // Treat as varies if invalid or in the past
      }
      return date;
    })(),
    stipend: extractedData.benefits?.includes('stipend') ? (extractedData.stipend || 0) : undefined, // Assuming stipend is part of benefits or a separate field
    tuitionCovered: extractedData.fullyFunded || extractedData.benefits?.includes('tuition') || false,
    travelSupport: extractedData.benefits?.includes('travel') || false,
    eligibilityText: extractedData.eligibility_summary || '',
    requirements: [], // Placeholder, as eligibility_rules are more structured
    tags: [], // Placeholder
    confidence: 1.0, // Default confidence, will be updated by scoring
    createdAt: extractedData.updatedAt ? new Date(extractedData.updatedAt) : new Date(),
    updatedAt: new Date(),
  };

  // Map eligibility_rules to requirements or other fields as needed
  if (extractedData.eligibility_rules && Array.isArray(extractedData.eligibility_rules)) {
    normalized.requirements = extractedData.eligibility_rules.map((rule: any) => JSON.stringify(rule));
  }

  return normalized;
}