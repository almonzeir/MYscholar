import { geminiRerank } from '../reranking';
import { Scholarship } from '@/types/database';

describe('geminiRerank', () => {
  it('should rerank scholarships, preferring those with closer deadlines', async () => {
    const userProfile = {
      degreeTarget: 'Master',
      fields: ['Computer Science'],
      nationality: 'USA',
      residence: 'USA',
      languageProofs: ['TOEFL 90'],
      gpaBand: '80-89',
      workYears: 0,
      specialStatuses: [],
      deadlineWindowDays: 'Any',
    };

    const scholarshipVaries: Scholarship & { acceptanceScore: number; deadlineUrgency: number; fitScore: number; fundingStrength: number; } = {
      id: 'sch-varies',
      name: 'Scholarship Varies Deadline',
      sourceUrl: 'https://example.com/varies',
      domain: 'example.com',
      country: 'USA',
      degreeLevels: ['Master'],
      fields: ['Computer Science'],
      deadline: 'varies' as any, // Mock 'varies' deadline
      eligibilityText: '...',
      requirements: [],
      tags: [],
      confidence: 1.0,
      createdAt: new Date(),
      updatedAt: new Date(),
      acceptanceScore: 0.8,
      deadlineUrgency: 0, // Varies deadline has 0 urgency
      fitScore: 0.6 * 0.8 + 0.25 * 1 + 0.15 * 0, // Example calculation
      fundingStrength: 1,
    };

    const scholarship30Days: Scholarship & { acceptanceScore: number; deadlineUrgency: number; fitScore: number; fundingStrength: number; } = {
      id: 'sch-30days',
      name: 'Scholarship 30 Days Deadline',
      sourceUrl: 'https://example.com/30days',
      domain: 'example.com',
      country: 'USA',
      degreeLevels: ['Master'],
      fields: ['Computer Science'],
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
      eligibilityText: '...',
      requirements: [],
      tags: [],
      confidence: 1.0,
      createdAt: new Date(),
      updatedAt: new Date(),
      acceptanceScore: 0.8,
      deadlineUrgency: 1.0, // 30 days left has 1.0 urgency
      fitScore: 0.6 * 0.8 + 0.25 * 1 + 0.15 * 1.0, // Example calculation
      fundingStrength: 1,
    };

    const scoredScholarships = [scholarshipVaries, scholarship30Days];

    // Mock the fetch function for the Gemini API call
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  rankedBoosts: [
                    { id: 'sch-30days', boost: 0.1 }, // Positive boost for closer deadline
                    { id: 'sch-varies', boost: -0.1 }, // Negative boost for varies deadline
                  ],
                }),
              }],
            },
          }],
        }),
      })
    ) as jest.Mock;

    const reranked = await geminiRerank(userProfile, scoredScholarships);

    expect(reranked).toBeDefined();
    expect(reranked.length).toBe(2);
    expect(reranked[0].id).toBe('sch-30days');
    expect(reranked[1].id).toBe('sch-varies');
    expect(reranked[0].fitScore).toBeGreaterThan(reranked[1].fitScore);
  });
});