import { NextResponse } from 'next/server';
import { buildQueries, fanOutCSE } from '@/lib/services/googleSearch';
import { fetchOfficial } from '@/lib/services/dataIngestion';
import { geminiAI } from '@/lib/services/geminiAI'; // Keep geminiAI for now, will be used later for extraction
import { normalizeScholarship } from '@/lib/utils/dataNormalization';
import { scoreAll } from '@/lib/scoring/eligibilityScoring';
import { geminiRerank } from '@/lib/scoring/reranking';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const profileString = searchParams.get('profile');
  const userProfile = profileString ? JSON.parse(profileString) : {
    degreeTarget: '',
    fields: [],
    nationality: '',
    currentCountryOfResidence: '',
    languageProofs: [],
    gpaBand: '',
    graduationYear: '',
    workResearchYears: '',
    specialStatuses: [],
    deadlineWindow: 'Any',
  };

  // Fetch allowlisted domains
  const domainsResponse = await fetch(`${request.nextUrl.origin}/api/meta/domains`);
  const domainsData = await domainsResponse.json();
  const officialDomains = domainsData.data.domains;

  const queries = buildQueries(userProfile, officialDomains);
  const searchHits = await fanOutCSE(queries);

  // Fetch official pages and process with Gemini for extraction
  const officialPages = await fetchOfficial(searchHits);
  const extractedScholarships = [];
  for (const page of officialPages) {
    const extracted = await geminiAI.geminiExtract(page);
    if (extracted) {
      extractedScholarships.push(extracted);
    }
  }

  // Normalize the extracted scholarships
  const normalizedScholarships = extractedScholarships.map(scholarship => normalizeScholarship(scholarship));

  // Score the normalized scholarships
  const scoredScholarships = scoreAll(normalizedScholarships, userProfile);

  // Rerank the scholarships using Gemini
  const rerankedScholarships = await geminiRerank(userProfile, scoredScholarships);

  const totalScholarships = rerankedScholarships.length;
  const paginatedScholarships = rerankedScholarships.slice(offset, offset + limit);

  // TODO: Implement SSE streaming for progressive rendering here
  // Instead of returning a single JSON response, stream the results as they become available.
  return NextResponse.json({
    scholarships: paginatedScholarships,
    total: totalScholarships,
  });
}
