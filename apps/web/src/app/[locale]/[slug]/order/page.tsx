import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import OrderPage from '../../[slug]/order/page'
import { isStoreLocaleCode, buildStorePublicPath } from '@/i18n/store-locales'
import { isPurchasedPathLocale, loadStoreLocaleAccess, allPublicLocales } from '@/lib/store-locale-access'
import { buildStoreMetadata } from '@/lib/store-metadata'
import { createClient } from '@/lib/supabase/server'

async function primaryMeta(slug: string): Promise<Metadata> {
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
      'seo_title, seo_description, og_image_url, favicon_url, apple_touch_icon_url, gsc_verification, custom_domain, custom_domain_verified',
    )
    .eq('business_id', business.id)
    .single()
  return buildStoreMetadata({
    slug,
    businessName: business.name,
    pub: pub as Parameters<typeof buildStoreMetadata>[0]['pub'],
    pathSuffix: '/order',
    title: `${business.name} — Order`,
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isStoreLocaleCode(locale)) return { title: 'Not Found' }

  const access = await loadStoreLocaleAccess(slug)
  if (!access || !isPurchasedPathLocale(access, locale)) {
    return primaryMeta(slug)
  }

  const base = await primaryMeta(slug)
  const languages: Record<string, string> = {}
  for (const code of allPublicLocales(access)) {
    languages[code] = buildStorePublicPath(slug, {
      locale: code,
      primary: access.primary,
      kind: 'order',
    })
  }

  return {
    ...base,
    alternates: {
      ...(typeof base.alternates === 'object' ? base.alternates : {}),
      canonical: buildStorePublicPath(slug, {
        locale,
        primary: access.primary,
        kind: 'order',
      }),
      languages,
    },
  }
}

export default async function LocaleOrderPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  if (!isStoreLocaleCode(locale)) notFound()

  const access = await loadStoreLocaleAccess(slug)
  if (!access) notFound()

  if (locale === access.primary) {
    redirect(buildStorePublicPath(slug, { locale: access.primary, primary: access.primary, kind: 'order' }))
  }

  if (!isPurchasedPathLocale(access, locale)) {
    redirect(buildStorePublicPath(slug, { locale: access.primary, primary: access.primary, kind: 'order' }))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Page = OrderPage as any
  return <Page params={Promise.resolve({ slug })} />
}
