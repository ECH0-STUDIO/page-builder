'use client'

import Link from 'next/link'
import { Globe } from 'lucide-react'
import type { SupportedLocale } from '@/i18n/locale'
import { LOCALE_LABELS } from '@/i18n/locale'
import type { StoreLanguageConfig } from '@/i18n/store-locale'
import {
  alternateStoreLocale,
  storePublicPathForLocale,
} from '@/lib/store-routing'
import { cn } from '@/lib/utils'

interface StoreLanguageSwitcherProps {
  slug: string
  currentLocale: SupportedLocale
  languageConfig: StoreLanguageConfig
  kind?: 'landing' | 'order'
  className?: string
}

/** Guest-facing control to switch between primary and secondary store URLs. */
export function StoreLanguageSwitcher({
  slug,
  currentLocale,
  languageConfig,
  kind = 'landing',
  className,
}: StoreLanguageSwitcherProps) {
  if (!languageConfig.dual_language_enabled) return null

  const targetLocale = alternateStoreLocale(currentLocale, languageConfig)
  if (!targetLocale) return null

  const href = storePublicPathForLocale(slug, languageConfig, kind, targetLocale)

  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors',
        className,
      )}
      hrefLang={targetLocale}
    >
      <Globe className="size-4 shrink-0" aria-hidden />
      <span>{LOCALE_LABELS[targetLocale]}</span>
    </Link>
  )
}
