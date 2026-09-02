import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { buildStoreMetadata } from '@/lib/store-metadata'
import { guardPrefixedStoreRoute, runStoreLocaleGuard } from '@/lib/store-locale-guard'
import { storePublicPathForLocale } from '@/lib/store-routing'
import { StoreLandingPage } from '@/components/store/StoreLandingPage'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const guard = await guardPrefixedStoreRoute(locale, slug, 'landing')
  if ('redirect' in guard) {
    return { title: slug }
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: business } = await db
    .from('businesses')
    .select('id, name')
    .eq('slug', slug)
    .single()

  if (!business) return { title: 'Not Found' }

  const { data: pub } = await db
    .from('publishing_settings')
    .select(
      'seo_title, seo_description, seo_i18n, og_image_url, favicon_url, apple_touch_icon_url, gsc_verification, custom_domain, custom_domain_verified, language, dual_language_enabled, dual_language_setup_status, enabled_locales',
    )
    .eq('business_id', business.id)
    .single()

  const seoI18n = pub?.seo_i18n as Record<string, { title?: string; description?: string }> | null
  const localeSeo = seoI18n?.[guard.pathLocale]

  return buildStoreMetadata({
    slug,
    businessName: business.name,
    pub: pub as Parameters<typeof buildStoreMetadata>[0]['pub'],
    title: localeSeo?.title,
    description: localeSeo?.description,
    languageConfig: guard.languageConfig,
    activeLocale: guard.pathLocale,
  })
}

export default async function LocaleSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<{ table?: string }>
}) {
  const { locale, slug } = await params
  const sp = await searchParams
  const guard = await runStoreLocaleGuard(locale, slug, 'landing')

  const tableParam = (sp.table ?? '').trim()
  const tableRedirect = tableParam
    ? storePublicPathForLocale(guard.slug, guard.languageConfig, 'order') +
      `?table=${encodeURIComponent(tableParam)}`
    : null

  return (
    <StoreLandingPage
      slug={guard.slug}
      pathLocale={guard.pathLocale}
      languageConfig={guard.languageConfig}
      tableRedirect={tableRedirect}
    />
  )
}
