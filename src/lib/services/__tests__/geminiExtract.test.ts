import { geminiAI } from '../geminiAI';
import { OfficialPage } from '../dataIngestion';

describe('geminiExtract', () => {
  it('should extract scholarship details correctly from a sample DAAD page', async () => {
    const sampleHtml = `
      <html>
        <body>
          <h1>DAAD Scholarship Program</h1>
          <p>This scholarship offers a monthly stipend €934 and tuition waived.</p>
          <p>The application deadline is 31 Oct 2025.</p>
          <a href="https://www.daad.de/scholarship">Official Link</a>
        </body>
      </html>
    `;

    const mockPage: OfficialPage = {
      url: 'https://www.daad.de/scholarship',
      html: sampleHtml,
      hash: 'mock-hash',
      sourceUrl: 'https://www.daad.de/scholarship',
    };

    // Mock the fetch function for the Gemini API call
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  id: 'mock-id',
                  name: 'DAAD Scholarship Program',
                  country: 'Germany', // Assuming derived from DAAD
                  degree_levels: ['Master', 'PhD'],
                  fields: ['Any'],
                  benefits: ['tuition', 'stipend'],
                  fullyFunded: true,
                  eligibility_summary: 'Scholarship offers monthly stipend and tuition waiver.',
                  eligibility_rules: [],
                  deadline: '2025-10-31',
                  link: 'https://www.daad.de/scholarship',
                  source_domain: 'www.daad.de',
                  updatedAt: new Date().toISOString(),
                }),
              }],
            },
          }],
        }),
      })
    ) as jest.Mock;

    const extractedScholarship = await geminiAI.geminiExtract(mockPage);

    expect(extractedScholarship).toBeDefined();
    expect(extractedScholarship?.fullyFunded).toBe(true);
    expect(extractedScholarship?.benefits).toContain('tuition');
    expect(extractedScholarship?.benefits).toContain('stipend');
    expect(extractedScholarship?.deadline).toBe('2025-10-31');
    expect(extractedScholarship?.name).toBe('DAAD Scholarship Program');
    expect(extractedScholarship?.sourceUrl).toBe('https://www.daad.de/scholarship');
  });
});