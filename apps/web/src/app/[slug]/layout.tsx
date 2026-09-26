import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { I18nProvider } from '@/i18n/I18nProvider'
import { getDictionary } from '@/i18n/getDictionary'
import { resolveLiveLocale } from '@/i18n/locale'
import { getStoreBySlug } from '@/lib/store-data'

/**
 * Public live store layout — light mode only, with i18n for menu/cart strings.
 * One locale at a time: visitor cookie, then store default, then vi.
 */
export default async function SlugLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value

  let storeDefaultLocale: string | null = null
  try {
    // Same request as the page, so this does not add a second database round trip.
    const { publishing } = await getStoreBySlug(slug)
    storeDefaultLocale = (publishing as { language?: string | null } | null)?.language ?? null
  } catch {
    // Slug may not exist yet during static generation — fall back to cookie only
  }

  const locale = resolveLiveLocale(cookieLocale, storeDefaultLocale)
  const dictionary = await getDictionary(locale)

  return (
    <I18nProvider dictionary={dictionary}>
      <Suspense fallback={null}>{children}</Suspense>
    </I18nProvider>
  )
}
