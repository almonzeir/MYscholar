import { Scholarship } from '@/types/database';

import { UserProfile } from '@/types/profile'; // Import UserProfile

// Define a basic UserProfile type for scoring purposes
// This will be replaced by a more detailed type from the frontend profile
interface UserProfileForScoring extends UserProfile {
  // Add any specific fields needed for scoring that are not in UserProfile
  // For example, if gpaBand needs to be a number for scoring, convert it here.
  // For now, we'll use the UserProfile directly.
}

interface ScoredScholarship extends Scholarship {
  acceptanceScore: number;
  deadlineUrgency: number;
  fitScore: number;
  fundingStrength: number; // Added for clarity in FitScore calculation
}

/**
 * Scores a list of normalized scholarships based on user profile and eligibility rules.
 * @param scholarships - Array of normalized Scholarship objects.
 * @param userProfile - User's profile for scoring.
 * @returns Array of ScoredScholarship objects.
 */
export function scoreAll(
  scholarships: Scholarship[],
  userProfile: UserProfileForScoring
): ScoredScholarship[] {
  return scholarships.map((scholarship) => {
    let acceptanceScore = 0.5; // Base score
    let fundingStrength = 0;
    let conflictPenalties = 0;

    // 1. Deterministic filters and scoring components

    // Degree match
    const degreeMatch = userProfile.degreeTarget && scholarship.degreeLevels.includes(userProfile.degreeTarget) ? 1 : 0;
    acceptanceScore += 0.25 * degreeMatch;

    // Field overlap
    const fieldOverlap = userProfile.fields.some(field => scholarship.fields.includes(field)) ? 1 : 0;
    acceptanceScore += 0.25 * fieldOverlap;

    // Nationality rule
    let nationalityPass = 1;
    if (scholarship.eligibility_rules) {
      const nationalityRule = scholarship.eligibility_rules.find(rule => rule.rule === 'nationality');
      if (nationalityRule && nationalityRule.allowed && !nationalityRule.allowed.includes(userProfile.nationality)) {
        nationalityPass = 0;
      }
    }
    acceptanceScore += 0.2 * nationalityPass;

    // Work years pass
    let workYearsPass = 1;
    if (scholarship.eligibility_rules) {
      const workYearsRule = scholarship.eligibility_rules.find(rule => rule.rule === 'work_years_min');
      if (workYearsRule && userProfile.workYears < workYearsRule.value) {
        workYearsPass = 0;
      }
    }
    acceptanceScore += 0.1 * workYearsPass;

    // GPA band pass
    let gpaBandPass = 1;
    if (scholarship.eligibility_rules) {
      const gpaRule = scholarship.eligibility_rules.find(rule => rule.rule === 'gpa_min');
      if (gpaRule) {
        const userGpa = parseGpaBand(userProfile.gpaBand);
        const requiredGpa = gpaRule.value;
        if (userGpa < requiredGpa) {
          gpaBandPass = 0;
        }
      }
    }
    acceptanceScore += 0.1 * gpaBandPass;

    // Language pass (simplified)
    let languagePass = 1;
    if (scholarship.eligibility_rules) {
      const languageRule = scholarship.eligibility_rules.find(rule => rule.rule === 'language');
      if (languageRule && languageRule.values && !userProfile.languageProofs.some(proof => languageRule.values.includes(proof))) {
        languagePass = 0;
      }
    }
    acceptanceScore += 0.1 * languagePass;

    // Funding strength
    if (scholarship.tuitionCovered && scholarship.stipend) {
      fundingStrength = 1; // Fully funded
    } else if (scholarship.tuitionCovered || scholarship.stipend) {
      fundingStrength = 0.8; // Partially funded (tuition or stipend)
    } else {
      fundingStrength = 0.5; // Not fully funded
    }

    // Conflict penalties (simplified)
    // This would involve more complex logic based on age caps, residency conflicts, etc.
    // For now, let's add a dummy penalty if the country is "USA" and user is not "USA"
    if (scholarship.country === 'USA' && userProfile.nationality !== 'USA') {
      conflictPenalties += 0.15;
    }

    acceptanceScore -= 0.15 * conflictPenalties;

    // Clamp acceptanceScore to [0, 1]
    acceptanceScore = Math.max(0, Math.min(1, acceptanceScore));

    // 2. Compute DeadlineUrgency
    let deadlineUrgency = 0;
    if (scholarship.deadline === 'varies') {
      deadlineUrgency = 0;
    } else {
      const daysLeft = Math.ceil((scholarship.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 30) deadlineUrgency = 1.0;
      else if (daysLeft <= 60) deadlineUrgency = 0.7;
      else if (daysLeft <= 120) deadlineUrgency = 0.4;
      else deadlineUrgency = 0.1;
    }

    // 3. Compute FitScore
    const fitScore = 0.6 * acceptanceScore + 0.25 * fundingStrength + 0.15 * deadlineUrgency;

    return {
      ...scholarship,
      acceptanceScore,
      deadlineUrgency,
      fitScore,
      fundingStrength,
    };
  });
}

/**
 * Helper function to parse GPA band into a numerical value.
 * @param gpaBand - GPA band string (e.g., ">=90", "80-89", "<70").
 * @returns Numerical GPA value.
 */
function parseGpaBand(gpaBand: string): number {
  if (gpaBand.includes('>=')) {
    return parseInt(gpaBand.replace('>=', ''), 10);
  }
  if (gpaBand.includes('-')) {
    const [min, max] = gpaBand.split('-').map(s => parseInt(s, 10));
    return (min + max) / 2; // Return average for a range
  }
  if (gpaBand.includes('<')) {
    return parseInt(gpaBand.replace('<', ''), 10) - 1; // Just below the threshold
  }
  return parseInt(gpaBand, 10);
}