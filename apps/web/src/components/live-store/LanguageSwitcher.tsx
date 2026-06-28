'use client'

import { useTransition } from 'react'
import { useTranslation } from '@/i18n/I18nProvider'
import { setLiveStoreLocaleAction } from '@/app/actions/locale'
import { LOCALE_LABELS, type SupportedLocale } from '@/i18n/locale'
import { cn } from '@/lib/utils'

export function LanguageSwitcher({ currentLocale }: { currentLocale: SupportedLocale }) {
  const { t } = useTranslation()
  const [pending, startTransition] = useTransition()

  function switchLocale(locale: SupportedLocale) {
    if (locale === currentLocale || pending) return

    startTransition(async () => {
      await setLiveStoreLocaleAction(locale)
      window.location.reload()
    })
  }

  return (
    <div className="flex flex-col items-center gap-2 mt-4 pt-4 border-t border-current/10">
      <p className="text-xs opacity-60">{t('liveStore.language')}</p>
      <div className="inline-flex rounded-full border border-current/15 p-0.5 text-xs font-medium">
        {(['vi', 'en'] as const).map(locale => (
          <button
            key={locale}
            type="button"
            disabled={pending}
            onClick={() => switchLocale(locale)}
            className={cn(
              'px-3 py-1 rounded-full transition-colors',
              currentLocale === locale
                ? 'bg-current/15 font-semibold'
                : 'opacity-70 hover:opacity-100',
            )}
            aria-pressed={currentLocale === locale}
          >
            {LOCALE_LABELS[locale]}
          </button>
        ))}
      </div>
    </div>
  )
}
