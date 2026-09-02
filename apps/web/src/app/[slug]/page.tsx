import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { buildStoreMetadata } from '@/lib/store-metadata'
import { languageConfigFromPublishing } from '@/lib/store-routing'
import { StoreLandingPage } from '@/components/store/StoreLandingPage'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
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

  const languageConfig = languageConfigFromPublishing(pub)

  return buildStoreMetadata({
    slug,
    businessName: business.name,
    pub: pub as Parameters<typeof buildStoreMetadata>[0]['pub'],
    languageConfig,
    activeLocale: languageConfig.primary_locale,
  })
}

export default async function SlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ table?: string }>
}) {
  const { slug } = await params
  const sp = await searchParams
  const tableParam = (sp.table ?? '').trim()
  const tableRedirect = tableParam
    ? `/${slug}/order?table=${encodeURIComponent(tableParam)}`
    : null

  return (
    <StoreLandingPage
      slug={slug}
      tableRedirect={tableRedirect}
    />
  )
}
