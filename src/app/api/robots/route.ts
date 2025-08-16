import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://scholarshipplatform.com'
  
  const robots = `User-agent: *
Allow: /
Allow: /search
Allow: /premium

Disallow: /admin
Disallow: /api/
Disallow: /_next/
Disallow: /premium/success
Disallow: /premium/cancel

Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1`

  return new NextResponse(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400'
    }
  })
}