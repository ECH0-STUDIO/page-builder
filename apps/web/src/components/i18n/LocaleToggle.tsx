'use client'

import { LOCALE_LABELS, type SupportedLocale } from '@/i18n/locale'
import { cn } from '@/lib/utils'

export function LocaleToggle({
  value,
  onChange,
  className,
  size = 'sm',
}: {
  value: SupportedLocale
  onChange: (locale: SupportedLocale) => void
  className?: string
  size?: 'sm' | 'xs'
}) {
  return (
    <div
      className={cn(
        'inline-flex rounded-full border border-border p-0.5 font-medium',
        size === 'xs' ? 'text-[10px]' : 'text-xs',
        className,
      )}
    >
      {(['vi', 'en'] as const).map(locale => (
        <button
          key={locale}
          type="button"
          onClick={() => onChange(locale)}
          className={cn(
            'rounded-full transition-colors',
            size === 'xs' ? 'px-2 py-0.5' : 'px-2.5 py-1',
            value === locale
              ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
          aria-pressed={value === locale}
        >
          {locale === 'vi' ? '🇻🇳' : '🇬🇧'} {LOCALE_LABELS[locale]}
        </button>
      ))}
    </div>
  )
}
