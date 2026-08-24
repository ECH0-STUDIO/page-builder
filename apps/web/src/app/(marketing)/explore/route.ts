import { finalizeMarketingHtml } from '@/lib/marketing-html-response'
import {
  listExploreBusinesses,
  listExploreCities,
  withExploreSearchMeta,
} from '@/lib/explore-directory'
import { getDictionary } from '@/i18n/getDictionary'
import { BUSINESS_CATEGORIES, BUSINESS_TAGS } from '@/lib/constants'
import { getMarketingLocaleFromRequest } from '@/lib/marketing-locale'
import { loadMarketingHtmlDocument } from '@/lib/marketing-webflow'
import {
  buildExploreClientAssets,
  parseExploreFilters,
  renderExplorePageHtml,
  type ExploreRenderLabels,
} from '@/lib/marketing-explore-html'

export const dynamic = 'force-dynamic'

const HTML_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store',
} as const

export async function GET(request: Request) {
  const locale = getMarketingLocaleFromRequest(request)
  const url = new URL(request.url)
  const filters = parseExploreFilters(url)

  const dictionary = await getDictionary(locale)
  const explore = (dictionary as { explore: Record<string, string> }).explore
  const onboardingCategories = (
    dictionary as { onboarding?: { categories?: Record<string, string> } }
  ).onboarding?.categories ?? {}
  const tagsList = (
    dictionary as { businessProfile?: { tagsList?: Record<string, string> } }
  ).businessProfile?.tagsList ?? {}

  const categoryLabels: Record<string, string> = {}
  for (const c of BUSINESS_CATEGORIES) {
    categoryLabels[c.value] = onboardingCategories[c.value] ?? c.label
  }
  const tagLabels: Record<string, string> = {}
  for (const t of BUSINESS_TAGS) {
    tagLabels[t] = tagsList[t] ?? t
  }

  const labels: ExploreRenderLabels = {
    title: explore.title,
    metaDescription: explore.metaDescription,
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

  const allBusinesses = withExploreSearchMeta(
    await listExploreBusinesses({ sort: 'az' }, locale),
    categoryLabels,
    tagLabels,
  )
  const citiesFromData = listExploreCities(allBusinesses)

  const base =
    loadMarketingHtmlDocument('explore') ??
    loadMarketingHtmlDocument('pricing') ??
    loadMarketingHtmlDocument('features')
  if (!base) {
    return new Response('Not found', { status: 404 })
  }

  const rendered = renderExplorePageHtml(
    base,
    allBusinesses,
    citiesFromData,
    filters,
    labels,
    locale,
  )

  const finalized = finalizeMarketingHtml(rendered, request, locale, {
    pageSlug: 'explore',
    seo: {
      title: labels.title,
      description: labels.metaDescription,
      canonicalPath: '/explore',
    },
  })

  const clientAssets = buildExploreClientAssets(allBusinesses, labels, locale)
  const html = finalized.replace(/<\/body>/i, `${clientAssets}\n</body>`)

  return new Response(html, { headers: HTML_HEADERS })
}
