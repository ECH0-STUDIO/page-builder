'use client'

import { cn } from '@/lib/utils'
import { useEditorLocale, localeTabLabel } from '@/components/i18n/EditorLocaleContext'
import type { SupportedLocale } from '@/i18n/locale'

/** Primary | Secondary toggle for page/order editors when dual language is on. */
export function LocaleEditBar({ className }: { className?: string }) {
  const {
    dualEnabled,
    contentLocale,
    primaryLocale,
    secondaryLocale,
    setContentLocale,
    secondaryLocked,
  } = useEditorLocale()

  if (!dualEnabled) return null

  const tabs: SupportedLocale[] = [primaryLocale, secondaryLocale]

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5 shrink-0',
        className,
      )}
      role="tablist"
      aria-label="Content language"
    >
      {tabs.map(locale => {
        const active = contentLocale === locale
        const isPrimary = locale === primaryLocale
        return (
          <button
            key={locale}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setContentLocale(locale)}
            className={cn(
              'px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            title={
              isPrimary
                ? 'Primary language — full editing'
                : 'Secondary language — text only'
            }
          >
            {localeTabLabel(locale)}
            {!isPrimary && secondaryLocked && active && (
              <span className="ml-1 text-[10px] text-muted-foreground">· text</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Independent VI | EN tabs for menu builder (both fully editable). */
export function MenuLocaleTabs({ className }: { className?: string }) {
  const { dualEnabled, contentLocale, setContentLocale } = useEditorLocale()

  if (!dualEnabled) return null

  const tabs: SupportedLocale[] = ['vi', 'en']

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5',
        className,
      )}
      role="tablist"
      aria-label="Menu language"
    >
      {tabs.map(locale => {
        const active = contentLocale === locale
        return (
          <button
            key={locale}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setContentLocale(locale)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {locale.toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}
