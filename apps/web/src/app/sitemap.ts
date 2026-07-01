import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getAppBaseUrl, getMarketingBaseUrl } from '@/lib/site-urls'
import { getAllBlogPosts } from '@/lib/blog'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const marketingBase = getMarketingBaseUrl()
  const appBase = getAppBaseUrl()

  const marketingPages: MetadataRoute.Sitemap = [
    { url: marketingBase, changeFrequency: 'weekly', priority: 1 },
    { url: `${marketingBase}/pricing`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${marketingBase}/features`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${marketingBase}/contact`, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${marketingBase}/blog`, changeFrequency: 'weekly', priority: 0.7 },
  ]

  let blogPages: MetadataRoute.Sitemap = []
  try {
    const posts = await getAllBlogPosts()
    const seen = new Set<string>()
    for (const post of posts) {
      if (seen.has(post.slug)) continue
      seen.add(post.slug)
      blogPages.push({
        url: `${marketingBase}/blog/${post.slug}`,
        lastModified: new Date(post.publishedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })
    }
  } catch {
    /* ignore */
  }

  let restaurantPages: MetadataRoute.Sitemap = []
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: published } = await supabase
      .from('publishing_settings')
      .select('business_id, updated_at')
      .eq('published', true)

    if (published && published.length > 0) {
      const businessIds = published.map((p: { business_id: string }) => p.business_id)
      const { data: businesses } = await supabase
        .from('businesses')
        .select('slug, updated_at')
        .in('id', businessIds)

      restaurantPages = (businesses ?? []).map((b: { slug: string; updated_at: string }) => ({
        url: `${appBase}/${b.slug}`,
        lastModified: new Date(b.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }
  } catch {
    /* ignore */
  }

  return [...marketingPages, ...blogPages, ...restaurantPages]
}
