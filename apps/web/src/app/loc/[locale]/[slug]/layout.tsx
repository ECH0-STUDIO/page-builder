import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { I18nProvider } from '@/i18n/I18nProvider'
import { getDictionary } from '@/i18n/getDictionary'
import { toSupportedLocale } from '@/i18n/locale'
import { isStoreLocaleCode } from '@/i18n/store-locales'

export default async function LocaleSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
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
    // ignore
  }

  // Prefer path locale for system chrome when it's a known store locale code;
  // dashboard dictionaries only support vi|en — fall back accordingly.
  const pathUi = isStoreLocaleCode(locale) && (locale === 'vi' || locale === 'en')
    ? locale
    : null
  const uiLocale = toSupportedLocale(pathUi || cookieLocale || storeDefaultLocale)
  const dictionary = await getDictionary(uiLocale)

  return (
    <I18nProvider dictionary={dictionary}>
      <Suspense fallback={null}>{children}</Suspense>
    </I18nProvider>
  )
}
