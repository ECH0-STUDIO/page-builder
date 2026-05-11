import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

/**
 * Dynamic sitemap — lists all published business pages.
 * Only included when SUPABASE_SERVICE_ROLE_KEY is set (i.e. server-side).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000'
  const baseUrl = appUrl.startsWith('http') ? appUrl : `https://${appUrl}`

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get all published business slugs
    const { data: published } = await supabase
      .from('publishing_settings')
      .select('business_id, updated_at')
      .eq('published', true)

    if (!published || published.length === 0) return []

    const businessIds = published.map((p: { business_id: string }) => p.business_id)
    const { data: businesses } = await supabase
      .from('businesses')
      .select('slug, updated_at')
      .in('id', businessIds)

    return (businesses ?? []).map((b: { slug: string; updated_at: string }) => ({
      url: `${baseUrl}/${b.slug}`,
      lastModified: new Date(b.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch {
    return []
  }
}
