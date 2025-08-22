import { Scholarship } from '@/types/database';
import { geminiAI } from '@/lib/services/geminiAI'; // Assuming geminiAI has the API call logic

import { UserProfile } from '@/types/profile'; // Import UserProfile

// Define a basic UserProfile type for reranking purposes
// This will be replaced by a more detailed type from the frontend profile
interface UserProfileForReranking extends UserProfile {
  // Add any specific fields needed for reranking that are not in UserProfile
  // For now, we'll use the UserProfile directly.
}

interface ScoredScholarship extends Scholarship {
  acceptanceScore: number;
  deadlineUrgency: number;
  fitScore: number;
  fundingStrength: number;
}

interface RerankedBoost {
  id: string;
  boost: number;
}

/**
 * Reranks a list of scored scholarships using Gemini AI.
 * @param userProfile - User's profile for reranking.
 * @param scoredScholarships - Array of ScoredScholarship objects.
 * @returns A Promise that resolves to an array of ScoredScholarship objects, reranked.
 */
export async function geminiRerank(
  userProfile: UserProfileForReranking,
  scoredScholarships: ScoredScholarship[]
): Promise<ScoredScholarship[]> {
  console.log('Gemini reranking scholarships...');

  // Limit candidates to top ~100 for reranking
  const candidatesForRerank = scoredScholarships.slice(0, 100);

  // Prepare profile and candidates for the Gemini prompt
  const profileForPrompt = {
    degreeTarget: userProfile.degreeTarget,
    fields: userProfile.fields,
    nationality: userProfile.nationality,
    residence: userProfile.residence,
    langProofs: userProfile.languageProofs,
    gpaBand: userProfile.gpaBand,
    workYears: userProfile.workYears,
    specialStatuses: userProfile.specialStatuses,
    deadlineWindowDays: userProfile.deadlineWindowDays,
  };

  const candidatesForPrompt = candidatesForRerank.map(sch => ({
    id: sch.id,
    name: sch.name,
    degree_levels: sch.degreeLevels,
    fields: sch.fields,
    fullyFunded: sch.tuitionCovered && sch.stipend !== undefined && sch.stipend > 0, // fullyFunded = true only if tuition + stipend are present on page.
    eligibility_rules: sch.requirements.map(req => JSON.parse(req)), // Convert back from stringified JSON
    deadline: sch.deadline === 'varies' ? 'varies' : sch.deadline.toISOString().split('T')[0],
    link: sch.sourceUrl,
  }));

  const promptText = `
    PROFILE:
    ${JSON.stringify(profileForPrompt, null, 2)}

    CANDIDATES:
    ${JSON.stringify(candidatesForPrompt, null, 2)}
  `;

  let rerankedBoosts: RerankedBoost[] = [];

  try {
    // Call Gemini API for reranking
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          generationConfig: { response_mime_type: 'application/json' },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini Rerank API error:', errorData);
      // Fallback to original sorting if API call fails
      return scoredScholarships.sort((a, b) => b.fitScore - a.fitScore);
    }

    const data = await response.json();
    const extractedBoosts = data.candidates[0].content.parts[0].text;
    const parsedBoosts = JSON.parse(extractedBoosts);

    if (parsedBoosts && parsedBoosts.rankedBoosts && Array.isArray(parsedBoosts.rankedBoosts)) {
      rerankedBoosts = parsedBoosts.rankedBoosts;
    }
  } catch (error) {
    console.error('Error calling Gemini Rerank API:', error);
    // Fallback to original sorting if API call fails
    return scoredScholarships.sort((a, b) => b.fitScore - a.fitScore);
  }

  // Apply boosts and re-sort
  const finalRankedScholarships = scoredScholarships.map(sch => {
    const boostItem = rerankedBoosts.find(boost => boost.id === sch.id);
    const boost = boostItem ? boostItem.boost : 0; // Default boost to 0 if not found
    return {
      ...sch,
      fitScore: sch.fitScore + boost, // Apply boost to fitScore
    };
  }).sort((a, b) => b.fitScore - a.fitScore); // Sort by new fitScore

  // Keep top 25
  return finalRankedScholarships.slice(0, 25);
}