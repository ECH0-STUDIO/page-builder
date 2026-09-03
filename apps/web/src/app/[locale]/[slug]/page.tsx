import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import SlugPage, { generateMetadata as generatePrimaryMetadata } from '../../[slug]/page'
import { isStoreLocaleCode, buildStorePublicPath } from '@/i18n/store-locales'
import { isPurchasedPathLocale, loadStoreLocaleAccess, allPublicLocales } from '@/lib/store-locale-access'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isStoreLocaleCode(locale)) return { title: 'Not Found' }

  const access = await loadStoreLocaleAccess(slug)
  if (!access || !isPurchasedPathLocale(access, locale)) {
    return generatePrimaryMetadata({ params: Promise.resolve({ slug }) })
  }

  const base = await generatePrimaryMetadata({ params: Promise.resolve({ slug }) })
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

  // Phase B: serve primary content at the locale URL (translations land in Phase C).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Page = SlugPage as any
  return <Page params={Promise.resolve({ slug })} searchParams={searchParams} />
}
