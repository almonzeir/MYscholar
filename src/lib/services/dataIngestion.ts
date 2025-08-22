import { JSDOM } from 'jsdom'; // For parsing HTML and extracting links
import crypto from 'crypto'; // For generating URL hashes

interface SearchHit {
  title: string;
  link: string;
  snippet: string;
}

interface OfficialPage {
  url: string;
  html: string;
  hash: string;
  sourceUrl: string; // Original URL from search hit
}

/**
 * Fetches HTML content from a list of search hits, canonicalizes URLs, and deduplicates.
 * @param searchHits - Array of search hits from Google CSE.
 * @returns A Promise that resolves to an array of OfficialPage objects.
 */
export async function fetchOfficial(searchHits: SearchHit[]): Promise<OfficialPage[]> {
  const officialPages: OfficialPage[] = [];
  const visitedHashes = new Set<string>();

  for (const hit of searchHits) {
    try {
      // First, check reachability with a HEAD request
      const headResponse = await fetch(hit.link, { method: 'HEAD' });
      if (!headResponse.ok) {
        console.warn(`Unreachable URL (HEAD) ${hit.link}: ${headResponse.statusText}`);
        continue;
      }

      // Ensure it's an HTML page before fetching full content
      const contentType = headResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('text/html')) {
        console.warn(`Skipping non-HTML content at ${hit.link}. Content-Type: ${contentType}`);
        continue;
      }

      const response = await fetch(hit.link);
      if (!response.ok) {
        console.warn(`Failed to fetch ${hit.link}: ${response.statusText}`);
        continue;
      }

      const html = await response.text();
      const urlHash = crypto.createHash('sha256').update(hit.link).digest('hex');

      // Check if the domain is allowlisted (more robust check)
      const isOfficialDomain = await isDomainOfficial(new URL(hit.link).hostname);

      if (!visitedHashes.has(urlHash)) {
        if (isOfficialDomain) {
          officialPages.push({
            url: hit.link,
            html,
            hash: urlHash,
            sourceUrl: hit.link,
          });
          visitedHashes.add(urlHash);
        } else if (isAggregator(hit.link)) {
          // If it's an aggregator, try to find official links within it
          const dom = new JSDOM(html);
          const links = Array.from(dom.window.document.querySelectorAll('a'))
            .map(a => (a as HTMLAnchorElement).href)
            .filter(href => href.startsWith('http')); // Only absolute URLs

          for (const internalLink of links) {
            try {
              const internalUrl = new URL(internalLink);
              const internalUrlHash = crypto.createHash('sha256').update(internalLink).digest('hex');

              // Only follow and fetch if the internal link is to an official domain
              if (!visitedHashes.has(internalUrlHash) && await isDomainOfficial(internalUrl.hostname)) {
                const internalHeadResponse = await fetch(internalLink, { method: 'HEAD' });
                if (!internalHeadResponse.ok) {
                  console.warn(`Unreachable internal URL (HEAD) ${internalLink}: ${internalHeadResponse.statusText}`);
                  continue;
                }
                const internalContentType = internalHeadResponse.headers.get('content-type');
                if (!internalContentType || !internalContentType.includes('text/html')) {
                  console.warn(`Skipping non-HTML internal content at ${internalLink}. Content-Type: ${internalContentType}`);
                  continue;
                }

                const internalResponse = await fetch(internalLink);
                if (internalResponse.ok) {
                  const internalHtml = await internalResponse.text();
                  officialPages.push({
                    url: internalLink,
                    html: internalHtml,
                    hash: internalUrlHash,
                    sourceUrl: hit.link, // Original aggregator link
                  });
                  visitedHashes.add(internalUrlHash);
                }
              }
            } catch (internalError) {
              console.warn(`Failed to process internal link ${internalLink}:`, internalError);
            }
          }
        }
      }

    } catch (error) {
      console.error(`Error processing search hit ${hit.link}:`, error);
    }
  }

  return officialPages;
}

/**
 * Simple heuristic to determine if a URL is likely an aggregator.
 * This would be replaced by a more sophisticated check using a predefined list of aggregators.
 */
function isAggregator(url: string): boolean {
  // Example: Check for common aggregator keywords in the URL
  return url.includes('scholarship-positions.com') || url.includes('scholars4dev.com');
}

/**
 * Checks if a given hostname is in the allowlisted official domains.
 * This function will call the /api/domains endpoint.
 * @param hostname - The hostname to check.
 * @returns A Promise that resolves to true if the domain is official, false otherwise.
 */
async function isDomainOfficial(hostname: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/meta/domains/verify?domain=${hostname}`, { method: 'HEAD' });
    return response.ok; // 200 OK means it's trusted
  } catch (error) {
    console.error(`Error checking domain official status for ${hostname}:`, error);
    return false;
  }
}