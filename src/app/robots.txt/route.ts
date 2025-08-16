import { NextResponse } from 'next/server'

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /
Allow: /search
Allow: /legal/*

Disallow: /admin
Disallow: /api/*
Disallow: /premium/success
Disallow: /premium/cancel

Sitemap: ${process.env.NEXTAUTH_URL || 'https://scholarshipplatform.com'}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1`

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}