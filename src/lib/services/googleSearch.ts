const GOOGLE_CSE_API_KEY = process.env.GOOGLE_CSE_KEY || 'YOUR_GOOGLE_CSE_API_KEY';
const GOOGLE_CSE_CX = process.env.GOOGLE_CSE_CX || 'YOUR_GOOGLE_CSE_CX';

/**
 * Builds an array of search queries based on profile facets and official domains.
 * @param profile - User profile object.
 * @param officialDomains - Array of allowlisted official domains.
 * @returns An array of search query strings.
 */
export function buildQueries(profile: any, officialDomains: string[]): string[] {
  const queries: string[] = [];
  const baseQuery = 'fully funded scholarship';

  // Add profile facets to the query
  let profileFacets = '';
  if (profile.degreeTarget) profileFacets += ` ${profile.degreeTarget}`;
  if (profile.fields && profile.fields.length > 0) profileFacets += ` ${profile.fields.join(' OR ')}`;
  if (profile.nationality) profileFacets += ` ${profile.nationality}`;
  // Add other profile facets as needed

  // Generate queries blending profile facets + official domains
  officialDomains.forEach(domain => {
    // Example: site:daad.de fully funded Master stipend deadline <field>
    queries.push(`${baseQuery}${profileFacets} site:${domain}`);
    
    // Add more specific queries based on domain and profile
    if (domain.includes('chevening.org') && profile.nationality) {
      queries.push(`chevening.org scholarship ${profile.nationality} site:chevening.org`);
    }
    if (domain.includes('studyinjapan.go.jp')) {
      queries.push(`MEXT graduate stipend airfare site:studyinjapan.go.jp`);
    }
    // Add more domain-specific queries as per specification
  });

  // Add general queries if no specific domains are provided or for broader search
  if (officialDomains.length === 0) {
    queries.push(`${baseQuery}${profileFacets}`);
  }

  // Add "Erasmus Mundus" specific query
  queries.push(`"Erasmus Mundus" scholarship stipend deadline site:ec.europa.eu`);

  return queries;
}

/**
 * Executes Google Custom Search Engine queries and returns search hits.
 * @param queries - An array of search query strings.
 * @returns A Promise that resolves to an array of search hits.
 */
export async function fanOutCSE(queries: string[]): Promise<any[]> {
  const searchHits: any[] = [];

  for (const query of queries) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_CSE_API_KEY}&cx=${GOOGLE_CSE_CX}&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (data.items) {
        searchHits.push(...data.items.map((item: any) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
        })));
      }
    } catch (error) {
      console.error(`Error fetching search results for query "${query}":`, error);
    }
  }

  return searchHits;
}