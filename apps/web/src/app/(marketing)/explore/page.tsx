import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { ExploreClient, type ExploreLabels } from '@/components/explore/ExploreClient'
import {
  listExploreBusinesses,
  listExploreCities,
} from '@/lib/explore-directory'
import { getDictionary } from '@/i18n/getDictionary'
import { BUSINESS_CATEGORIES, BUSINESS_TAGS } from '@/lib/constants'
import { appPath } from '@/lib/site-urls'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value === 'en' ? 'en' : 'vi'
  const dictionary = await getDictionary(locale)
  const explore = (dictionary as { explore: Record<string, string> }).explore

  return {
    title: explore.title,
    description: explore.metaDescription,
  }
}

type SearchParams = Promise<{
  q?: string | string[]
  city?: string | string[]
  category?: string | string[]
  tag?: string | string[]
  sort?: string | string[]
}>

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const q = first(sp.q)
  const city = first(sp.city)
  const category = first(sp.category)
  const tag = first(sp.tag)
  const sortRaw = first(sp.sort)
  const sort: 'az' | 'za' = sortRaw === 'za' ? 'za' : 'az'

  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value === 'en' ? 'en' : 'vi'
  const dictionary = await getDictionary(locale)
  const explore = (dictionary as { explore: Record<string, string> }).explore
  const onboardingCategories = (
    dictionary as { onboarding?: { categories?: Record<string, string> } }
  ).onboarding?.categories ?? {}
  const tagsList = (
    dictionary as { businessProfile?: { tagsList?: Record<string, string> } }
  ).businessProfile?.tagsList ?? {}

  const title = explore.title

  const categoryLabels: Record<string, string> = {}
  for (const c of BUSINESS_CATEGORIES) {
    categoryLabels[c.value] = onboardingCategories[c.value] ?? c.label
  }
  const tagLabels: Record<string, string> = {}
  for (const t of BUSINESS_TAGS) {
    tagLabels[t] = tagsList[t] ?? t
  }

  const labels: ExploreLabels = {
    title,
    search: explore.search,
    city: explore.city,
    category: explore.category,
    tags: explore.tags,
    sort: explore.sort,
    sortAz: explore.sortAz,
    sortZa: explore.sortZa,
    visitWebsite: explore.visitWebsite,
    noResults: explore.noResults,
    allCities: explore.allCities,
    allCategories: explore.allCategories,
    allTags: explore.allTags,
    categoryLabels,
    tagLabels,
  }

  const [businesses, citySource] = await Promise.all([
    listExploreBusinesses({ q, city, category, tag, sort }),
    listExploreBusinesses({ sort: 'az' }),
  ])
  const citiesFromData = listExploreCities(citySource)

  return (
    <>
      <link rel="stylesheet" href="/marketing/css/normalize.css" />
      <link rel="stylesheet" href="/marketing/css/webflow.css" />
      <link
        rel="stylesheet"
        href="/marketing/css/thais-fantabulous-site-defac5.webflow.css"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
      />
      <ExploreClient
        businesses={businesses}
        citiesFromData={citiesFromData}
        initialFilters={{ q, city, category, tag, sort }}
        labels={labels}
        loginUrl={appPath('/login')}
      />
    </>
  )
}
