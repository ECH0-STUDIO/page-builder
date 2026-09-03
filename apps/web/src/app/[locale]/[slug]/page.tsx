import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import SlugPage from '../../[slug]/page'
import { createClient } from '@/lib/supabase/server'
import { isStoreLocaleCode, buildStorePublicPath } from '@/i18n/store-locales'
import { isPurchasedPathLocale, loadStoreLocaleAccess, allPublicLocales } from '@/lib/store-locale-access'
import { buildStoreMetadata } from '@/lib/store-metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isStoreLocaleCode(locale)) return { title: 'Not Found' }

  const access = await loadStoreLocaleAccess(slug)
  if (!access || !isPurchasedPathLocale(access, locale)) {
    return { title: 'Not Found' }
  }

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
      'seo_title, seo_description, seo_i18n, og_image_url, favicon_url, apple_touch_icon_url, gsc_verification, custom_domain, custom_domain_verified, language',
    )
    .eq('business_id', business.id)
    .single()

  const base = buildStoreMetadata({
    slug,
    businessName: business.name,
    pub: pub as Parameters<typeof buildStoreMetadata>[0]['pub'],
    contentLocale: locale,
    primaryLocale: access.primary,
  })

  const languages: Record<string, string> = {}
  for (const code of allPublicLocales(access)) {
    languages[code] = buildStorePublicPath(slug, {
      locale: code,
      primary: access.primary,
      kind: 'landing',
    })
  }

  return {
    ...base,
    alternates: {
      ...(typeof base.alternates === 'object' ? base.alternates : {}),
      canonical: buildStorePublicPath(slug, {
        locale,
        primary: access.primary,
        kind: 'landing',
      }),
      languages,
    },
  }
}

export default async function LocaleSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<{ table?: string }>
}) {
  const { locale, slug } = await params
  if (!isStoreLocaleCode(locale)) notFound()

  const access = await loadStoreLocaleAccess(slug)
  if (!access) notFound()

  // Primary must stay unprefixed
  if (locale === access.primary) {
    redirect(buildStorePublicPath(slug, { locale: access.primary, primary: access.primary }))
  }

  if (!isPurchasedPathLocale(access, locale)) {
    redirect(buildStorePublicPath(slug, { locale: access.primary, primary: access.primary }))
  }

  return (
    <SlugPage
      params={Promise.resolve({ slug })}
      searchParams={searchParams}
      contentLocale={locale}
    />
  )
}
