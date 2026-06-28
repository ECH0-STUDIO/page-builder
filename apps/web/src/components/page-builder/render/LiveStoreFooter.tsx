'use client'

import { useTranslationWithFallback } from '@/i18n/I18nProvider'
import { LanguageSwitcher } from '@/components/live-store/LanguageSwitcher'
import { toSupportedLocale } from '@/i18n/locale'

export function LiveStoreFooter({
  locale,
}: {
  locale?: string
  textColor?: string
}) {
  const activeLocale = toSupportedLocale(locale ?? 'vi')
  const { t } = useTranslationWithFallback(activeLocale)

  return (
    <>
      {locale && <LanguageSwitcher currentLocale={activeLocale} />}
      <p className="text-xs opacity-50 mt-2">
        {t('liveStore.poweredBy')}
      </p>
    </>
  )
}
