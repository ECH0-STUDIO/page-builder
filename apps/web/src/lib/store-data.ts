import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * Storefront rendering used to load the same two rows several times per request:
 * generateMetadata fetched the business and its publishing settings, the page
 * component fetched them again, and on locale routes loadStoreLocaleAccess made
 * a third pair. React's cache() dedupes them for the lifetime of one request —
 * Next only does that automatically for fetch(), not for Supabase queries.
 */
export const getStoreBySlug = cache(async (slug: string): Promise<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  business: any | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  publishing: any | null
}> => {
  const supabase = await createClient()

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (!business) return { business: null, publishing: null }

  const { data: publishing } = await supabase
    .from('publishing_settings')
    .select('*')
    .eq('business_id', business.id)
    .maybeSingle()

  return { business, publishing }
})
