import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { buildStoreMetadata } from '@/lib/store-metadata'
import { guardPrefixedStoreRoute, runStoreLocaleGuard } from '@/lib/store-locale-guard'
import { StoreOrderPage } from '@/components/store/StoreOrderPage'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const guard = await guardPrefixedStoreRoute(locale, slug, 'order')
  if ('redirect' in guard) return { title: slug }

  const supabase = await createClient()
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('slug', slug)
    .single()

  if (!business) return { title: 'Not Found' }

  const { data: pub } = await supabase
    .from('publishing_settings')
    .select(
      'seo_title, favicon_url, apple_touch_icon_url, gsc_verification, custom_domain, custom_domain_verified, language, dual_language_enabled, dual_language_setup_status, enabled_locales',
    )
    .eq('business_id', business.id)
    .single()

  return buildStoreMetadata({
    slug,
    businessName: business.name,
    pub: pub as Parameters<typeof buildStoreMetadata>[0]['pub'],
    title: `${business.name} — Order`,
    description: `Order from ${business.name}`,
    pathSuffix: '/order',
    languageConfig: guard.languageConfig,
    activeLocale: guard.pathLocale,
  })
}

export default async function LocaleOrderPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const guard = await runStoreLocaleGuard(locale, slug, 'order')

  return (
    <StoreOrderPage
      slug={guard.slug}
      pathLocale={guard.pathLocale}
      languageConfig={guard.languageConfig}
    />
  )
}
