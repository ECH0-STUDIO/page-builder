import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { buildStoreMetadata } from '@/lib/store-metadata'
import { languageConfigFromPublishing } from '@/lib/store-routing'
import { StoreOrderPage } from '@/components/store/StoreOrderPage'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const db = supabase

  const { data: business } = await db
    .from('businesses')
    .select('id, name')
    .eq('slug', slug)
    .single()

  if (!business) return { title: 'Not Found' }

  const { data: pub } = await db
    .from('publishing_settings')
    .select(
      'seo_title, favicon_url, apple_touch_icon_url, gsc_verification, custom_domain, custom_domain_verified, language, dual_language_enabled, dual_language_setup_status, enabled_locales',
    )
    .eq('business_id', business.id)
    .single()

  const languageConfig = languageConfigFromPublishing(pub)

  return buildStoreMetadata({
    slug,
    businessName: business.name,
    pub: pub as Parameters<typeof buildStoreMetadata>[0]['pub'],
    title: `${business.name} — Order`,
    description: `Order from ${business.name}`,
    pathSuffix: '/order',
    languageConfig,
    activeLocale: languageConfig.primary_locale,
  })
}

export default async function OrderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <StoreOrderPage slug={slug} />
}
