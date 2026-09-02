import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { I18nProvider } from '@/i18n/I18nProvider'
import { getDictionary } from '@/i18n/getDictionary'
import { resolveLiveLocale } from '@/i18n/locale'

/**
 * Public live store layout — light mode only, with i18n for menu/cart strings.
 * Prefixed routes (/en/{slug}) use the path locale; unprefixed routes use primary.
 */
export default async function LocaleSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const cookieStore = await cookies()

  let storePrimary: string | null = null
  let dualEnabled = false
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
        .select('language, dual_language_enabled, dual_language_setup_status, enabled_locales')
        .eq('business_id', business.id)
        .single()
      storePrimary = pub?.language ?? null
      dualEnabled = Boolean(pub?.dual_language_enabled)
    }
  } catch {
    // fall through
  }

  const pathLocale =
    locale === 'en' || locale === 'vi' ? locale : null

  const resolved = resolveLiveLocale({
    pathLocale,
    storePrimary,
    dualEnabled,
  })

  const dictionary = await getDictionary(resolved)

  return (
    <I18nProvider dictionary={dictionary}>
      <Suspense fallback={null}>{children}</Suspense>
    </I18nProvider>
  )
}
