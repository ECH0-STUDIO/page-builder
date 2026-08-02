import { createAdminClient } from '@/lib/supabase/server'
import { getPublicStoreUrl } from '@/lib/site-urls'
import { getDictionary } from '@/i18n/getDictionary'
import { BUSINESS_CATEGORIES, BUSINESS_TAGS } from '@/lib/constants'
import type { SupportedLocale } from '@/i18n/locale'

const EXPLORE_LIMIT = 200

export type ExploreBusiness = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  category: string[] | null
  tags: string[] | null
  address: string | null
  city: string | null
  websiteUrl: string
}

function searchTerms(q: string): string[] {
  return q
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
}

function matchesSearch(haystackParts: string[], q: string): boolean {
  const terms = searchTerms(q)
  if (terms.length === 0) return true
  const haystack = haystackParts.filter(Boolean).join(' ').toLowerCase()
  return terms.every((term) => haystack.includes(term))
}

export async function listExploreBusinesses(
  filters: {
    q?: string
    city?: string
    category?: string
    tag?: string
    sort?: 'az' | 'za'
  },
  locale: SupportedLocale = 'vi',
): Promise<ExploreBusiness[]> {
  const db = createAdminClient()
  const dictionary = await getDictionary(locale)
  const onboardingCategories = (
    dictionary as { onboarding?: { categories?: Record<string, string> } }
  ).onboarding?.categories ?? {}
  const tagsList = (
    dictionary as { businessProfile?: { tagsList?: Record<string, string> } }
  ).businessProfile?.tagsList ?? {}

  const { data: publishedRows, error: publishedError } = await db
    .from('publishing_settings')
    .select('business_id')
    .eq('published', true)

  if (publishedError) {
    console.error('explore: publishing_settings query failed', publishedError)
    return []
  }

  const publishedIds = (publishedRows ?? []).map(
    (row: { business_id: string }) => row.business_id,
  )
  if (publishedIds.length === 0) return []

  const { data: businesses, error: businessesError } = await db
    .from('businesses')
    .select('id, name, slug, logo_url, category, tags, address, city')
    .eq('marketplace_listed', true)
    .in('id', publishedIds)
    .limit(500)

  if (businessesError) {
    console.error('explore: businesses query failed', businessesError)
    return []
  }

  const q = filters.q?.trim()
  const city = filters.city?.trim()
  const category = filters.category?.trim()
  const tag = filters.tag?.trim()
  const sort = filters.sort === 'za' ? 'za' : 'az'

  let results = (businesses ?? [])
    .filter((b) => {
      if (q) {
        const categoryLabels = (b.category ?? []).flatMap((c) => {
          const fromDict = onboardingCategories[c]
          const fromConst = BUSINESS_CATEGORIES.find((x) => x.value === c)?.label
          return [c, fromDict, fromConst].filter(Boolean) as string[]
        })
        const tagLabels = (b.tags ?? []).flatMap((t) => {
          return [t, tagsList[t]].filter(Boolean) as string[]
        })
        const haystack = [
          b.name,
          b.slug,
          b.address,
          b.city,
          ...categoryLabels,
          ...tagLabels,
        ].filter((part): part is string => Boolean(part))
        if (!matchesSearch(haystack, q)) return false
      }
      if (city && b.city !== city) return false
      if (category && !(b.category ?? []).includes(category)) return false
      if (tag && !(b.tags ?? []).includes(tag)) return false
      return true
    })
    .map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logo_url: b.logo_url,
      category: b.category,
      tags: b.tags,
      address: b.address,
      city: b.city,
      websiteUrl: getPublicStoreUrl(b.slug),
    }))

  results.sort((a, b) => {
    const cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    return sort === 'za' ? -cmp : cmp
  })

  return results.slice(0, EXPLORE_LIMIT)
}

/** Distinct non-empty cities from an explore result set (sorted). */
export function listExploreCities(businesses: ExploreBusiness[]): string[] {
  const cities = new Set<string>()
  for (const b of businesses) {
    if (b.city?.trim()) cities.add(b.city.trim())
  }
  return Array.from(cities).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  )
}
