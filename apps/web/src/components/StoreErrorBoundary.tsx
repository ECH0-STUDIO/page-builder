'use client'

import { useEffect, useState } from 'react'
import { useTranslationWithFallback } from '@/i18n/I18nProvider'
import { toSupportedLocale, type SupportedLocale } from '@/i18n/locale'

/**
 * Diner-facing boundary. A storefront crash used to show Next's raw error
 * screen to a customer standing at a table with a QR code.
 */
export function StoreErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // The store's language lives on <html lang>, not in a provider this tree can read.
  const [locale, setLocale] = useState<SupportedLocale>('vi')
  const { t } = useTranslationWithFallback(locale)

  useEffect(() => {
    setLocale(toSupportedLocale(document.documentElement.lang))
  }, [])

  useEffect(() => {
    console.error('Storefront error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-sm text-center">
        <h1 className="text-lg font-semibold text-foreground">
          {t('errorBoundary.storeTitle')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('errorBoundary.storeBody')}
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 active:scale-95"
        >
          {t('errorBoundary.retry')}
        </button>
      </div>
    </div>
  )
}
