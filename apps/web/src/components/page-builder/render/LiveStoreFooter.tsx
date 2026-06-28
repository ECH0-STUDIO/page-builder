'use client'

import { useTranslationWithFallback } from '@/i18n/I18nProvider'

export function LiveStoreFooter() {
  const { t } = useTranslationWithFallback('vi')

  return (
    <p className="text-xs opacity-50 mt-2">
      {t('liveStore.poweredBy')}
    </p>
  )
}
