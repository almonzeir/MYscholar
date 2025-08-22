import { Scholarship } from '@/types/database';
import { OfficialPage } from '@/lib/services/dataIngestion'; // Import OfficialPage

// Placeholder for Gemini API Key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';

export const geminiAI = {
  

  geminiExtract: async (page: OfficialPage): Promise<Scholarship | null> => {
    console.log(`Gemini extracting data from: ${page.url}`);

    const promptText = `
      SCHEMA:
      {id,name,country,degree_levels[],fields[],benefits[],fullyFunded,eligibility_summary,eligibility_rules[],deadline,link,source_domain,updatedAt}

      PAGE_URL: ${page.url}
      PAGE_HTML_TEXT: ${page.html.substring(0, 100000)} // Truncate to 100k chars

      REQUIREMENTS:
      - Derive country from owning organization if obvious (e.g., Chevening→UK).
      - degree_levels must be subset of ["Bachelor","Master","PhD","Any"].
      - fullyFunded = true only if tuition + stipend are present on page.
      - deadline must be ISO YYYY-MM-DD if an exact date is stated; otherwise "varies".
      - eligibility_rules: list structured constraints (nationality, gpa_min, language with thresholds, work_years_min, age_max, residency).
      - source_domain = domain of PAGE_URL.
      - updatedAt = today’s date in ISO.
      Return JSON only.
    `;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
        console.error(`Gemini API error for ${page.url}:`, errorData);
        return null;
      }

      const data = await response.json();
      // Assuming the response directly contains the extracted JSON
      // You might need to parse data.candidates[0].content.parts[0].text depending on Gemini API response structure
      const extractedScholarship = data.candidates[0].content.parts[0].text;

      // Parse the extracted JSON and cast to Scholarship
      const scholarship: Scholarship = JSON.parse(extractedScholarship);

      // Add ID and source_domain if not already present (from specification)
      scholarship.id = scholarship.id || page.hash;
      scholarship.source_domain = scholarship.source_domain || new URL(page.url).hostname;
      scholarship.updatedAt = new Date(); // Ensure updatedAt is always current

      return scholarship;
    } catch (error) {
      console.error(`Error calling Gemini API for ${page.url}:`, error);
      return null;
    }
  },

  geminiNER: async (cvText: string): Promise<any | null> => {
    console.log('Gemini performing NER on CV text...');

    const promptText = `
      Extract the following entities from the CV text in JSON format:
      - degree (e.g., "Bachelor", "Master", "PhD")
      - field_keywords (e.g., ["Computer Science", "Software Engineering"])
      - gpa (numerical value, e.g., 3.7)
      - work_years (numerical value, total years of work experience)
      - language_proofs (e.g., ["IELTS 7.0", "TOEFL 100"])

      CV_TEXT:
      ${cvText}

      Return JSON only.
    `;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
        console.error('Gemini NER API error:', errorData);
        return null;
      }

      const data = await response.json();
      const extractedEntities = data.candidates[0].content.parts[0].text;
      return JSON.parse(extractedEntities);
    } catch (error) {
      console.error('Error calling Gemini NER API:', error);
      return null;
    }
  },
};