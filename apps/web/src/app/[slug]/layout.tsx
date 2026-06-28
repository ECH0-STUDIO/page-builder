import { Suspense } from 'react'
import { I18nProvider } from '@/i18n/I18nProvider'
import { getDictionary } from '@/i18n/getDictionary'

/**
 * Public live store layout — light mode only, with i18n for menu/cart strings.
 */
export default async function SlugLayout({ children }: { children: React.ReactNode }) {
  const dictionary = await getDictionary()

  return (
    <I18nProvider dictionary={dictionary}>
      <Suspense fallback={null}>{children}</Suspense>
    </I18nProvider>
  )
}
