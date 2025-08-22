import { scoreAll } from '../eligibilityScoring';
import { Scholarship } from '@/types/database';

describe('scoreAll - Eligibility', () => {
  it('should correctly score a scholarship against a user profile based on Chevening rules', () => {
    const userProfile = {
      degreeTarget: 'Master',
      fields: ['Maritime'],
      nationality: 'Sudanese',
      workYears: 2,
      gpaBand: '80-89', // Represents 82
      languageProofs: ['IELTS 7.0'],
      specialStatuses: [],
      deadlineWindowDays: 'Any',
    };

    const cheveningScholarship: Scholarship = {
      id: 'chevening-1',
      name: 'Chevening Scholarship',
      sourceUrl: 'https://www.chevening.org',
      domain: 'chevening.org',
      country: 'UK',
      degreeLevels: ['Master'],
      fields: ['Any'], // Chevening is often open to many fields
      deadline: new Date('2025-12-01'),
      eligibilityText: 'Applicants must have at least two years of work experience...',
      requirements: [], // Not directly used in this test, but part of Scholarship
      tags: ['UK', 'Government'],
      confidence: 1.0,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Mock eligibility_rules for Chevening
      eligibility_rules: [
        { rule: 'work_years_min', value: 2 },
        { rule: 'nationality', allowed: ['Sudanese', 'Egyptian', 'Moroccan'] },
        { rule: 'language', values: ['IELTS 6.5', 'TOEFL 90'], optional: false },
      ],
    };

    const scoredScholarships = scoreAll([cheveningScholarship], userProfile);
    const scoredChevening = scoredScholarships[0];

    expect(scoredChevening).toBeDefined();
    expect(scoredChevening.acceptanceScore).toBeGreaterThanOrEqual(0.75);
  });
});