'use client'

import { useTranslationWithFallback } from '@/i18n/I18nProvider'
import { LanguageSwitcher } from '@/components/live-store/LanguageSwitcher'
import type { SupportedLocale } from '@/i18n/locale'

export function LiveStoreFooter({
  locale,
}: {
  locale?: SupportedLocale
  textColor?: string
}) {
  const { t } = useTranslationWithFallback(locale ?? 'vi')

  return (
    <>
      {locale && <LanguageSwitcher currentLocale={locale} />}
      <p className="text-xs opacity-50 mt-2">
        {t('liveStore.poweredBy')}
      </p>
    </>
  )
}
