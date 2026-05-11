import type { MetadataRoute } from 'next'

/**
 * Dynamic robots.txt
 * - Allow all crawlers to index the site
 * - Individual draft pages return 404 so bots naturally won't index them
 * - Block /dashboard/ and /api/ from crawling
 */
export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000'
  const baseUrl = appUrl.startsWith('http') ? appUrl : `https://${appUrl}`

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/api/', '/onboarding/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
