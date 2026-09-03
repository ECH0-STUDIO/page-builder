import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { I18nProvider } from '@/i18n/I18nProvider'
import { getDictionary } from '@/i18n/getDictionary'
import { resolveLiveLocale } from '@/i18n/locale'

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
    const supabase = await createClient()
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('slug', slug)
      .single()

    if (business) {
      const { data: pub } = await supabase
        .from('publishing_settings')
        .select('language')
        .eq('business_id', business.id)
        .single()
      storeDefaultLocale = pub?.language ?? null
    }
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
