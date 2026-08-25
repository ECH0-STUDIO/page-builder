import type { MetadataRoute } from 'next'
import { getAppBaseUrl, getMarketingBaseUrl } from '@/lib/site-urls'

/**
 * Dynamic robots.txt for both marketing and app hosts.
 * Point crawlers at the marketing sitemap (includes marketing + public store URLs).
 */
export default function robots(): MetadataRoute.Robots {
  const marketingBase = getMarketingBaseUrl()
  const appBase = getAppBaseUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/api/', '/onboarding/', '/login', '/signup', '/invite/'],
      },
    ],
    // Same sitemap payload on both hosts; prefer marketing origin in the directive.
    sitemap: [`${marketingBase}/sitemap.xml`, `${appBase}/sitemap.xml`],
  }
}
