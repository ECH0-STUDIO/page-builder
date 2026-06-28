'use client'

import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/I18nProvider'
import {
  DEFAULT_ENABLED_LOCALES,
  LOCALE_CREDIT_COST_PER_MONTH,
  OPTIONAL_LOCALES,
} from '@/i18n/locale-content'
import { LOCALE_LABELS, type SupportedLocale } from '@/i18n/locale'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface LocaleBarProps {
  enabledLocales: string[]
  activeLocale: string
  onActiveLocaleChange: (locale: string) => void
  onAddLocale: (locale: string) => void
  className?: string
}

export function LocaleBar({
  enabledLocales,
  activeLocale,
  onActiveLocaleChange,
  onAddLocale,
  className,
}: LocaleBarProps) {
  const { t } = useTranslation()
  const availableToAdd = OPTIONAL_LOCALES.filter(
    o => !enabledLocales.includes(o.code),
  )

  return (
    <div
      className={cn(
        'shrink-0 border-b border-border bg-muted/30 px-3 py-2 flex flex-wrap items-center gap-2',
        className,
      )}
    >
      <span className="text-xs font-medium text-muted-foreground mr-1">
        {t('pageBuilder.contentLanguage')}
      </span>
      <div className="flex flex-wrap items-center gap-1">
        {enabledLocales.map(code => {
          const label = LOCALE_LABELS[code as SupportedLocale] ?? OPTIONAL_LOCALES.find(o => o.code === code)?.label ?? code.toUpperCase()
          const isActive = code === activeLocale
          return (
            <button
              key={code}
              type="button"
              onClick={() => onActiveLocaleChange(code)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-background border border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          )
        })}
        {availableToAdd.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs gap-1">
                <Plus className="size-3" />
                {t('pageBuilder.addLanguage')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <p className="px-2 py-1.5 text-[10px] text-muted-foreground leading-snug">
                {t('pageBuilder.addLanguageCreditNote').replace('{{credits}}', String(LOCALE_CREDIT_COST_PER_MONTH))}
              </p>
              {availableToAdd.map(o => (
                <DropdownMenuItem key={o.code} onClick={() => onAddLocale(o.code)}>
                  {o.label} ({o.code})
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground ml-auto hidden sm:inline">
        {t('pageBuilder.perLocaleFieldsHint')}
      </span>
    </div>
  )
}

export { DEFAULT_ENABLED_LOCALES }
