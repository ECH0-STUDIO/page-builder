'use client'

/**
 * Compact header for the order page — logo + name only (not sticky).
 */

import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from '@/i18n/I18nProvider'
import { cn } from '@/lib/utils'
import type { OrderChromeTokens } from '@/lib/color-contrast'
import type { SupportedLocale } from '@/i18n/locale'
import type { StoreLanguageConfig } from '@/i18n/store-locale'
import { StoreLanguageSwitcher } from '@/components/store/StoreLanguageSwitcher'

interface OrderPageHeaderProps {
  slug: string
  businessName: string
  logoUrl?: string | null
  brandColor: string
  chrome?: OrderChromeTokens
  languageConfig?: StoreLanguageConfig
  currentLocale?: SupportedLocale
}

export function OrderPageHeader({
  slug,
  businessName,
  logoUrl,
  brandColor,
  chrome,
  languageConfig,
  currentLocale,
}: OrderPageHeaderProps) {
  const searchParams = useSearchParams()
  const table = (searchParams.get('table') ?? '').trim()
  const { t } = useTranslation()

  return (
    <header
      className={cn('border-b', !chrome && 'border-black/6 bg-white')}
      style={
        chrome
          ? {
              backgroundColor: chrome.background,
              borderColor: chrome.border,
              color: chrome.text,
            }
          : undefined
      }
    >
      <div className="relative mx-auto flex h-14 max-w-[1440px] items-center justify-center gap-2.5 px-4 sm:px-6">
        {logoUrl ? (
          <div className="relative size-8 shrink-0 overflow-hidden rounded-full bg-gray-100">
            <Image src={logoUrl} alt="" fill className="object-cover" sizes="32px" />
          </div>
        ) : (
          <div
            className="size-8 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: brandColor }}
          >
            {businessName.charAt(0).toUpperCase()}
          </div>
        )}
        <span
          className={cn(
            'truncate text-sm font-semibold tracking-tight max-w-[60%]',
            !chrome && 'text-gray-900',
          )}
          style={chrome ? { color: chrome.text } : undefined}
        >
          {businessName}
        </span>

        {table ? (
          <span
            className="absolute right-4 sm:right-6 inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold text-white"
            style={{ backgroundColor: brandColor, color: chrome?.brandText ?? '#FFFFFF' }}
          >
            {t('orderPage.table')} {table}
          </span>
        ) : languageConfig && currentLocale ? (
          <StoreLanguageSwitcher
            slug={slug}
            currentLocale={currentLocale}
            languageConfig={languageConfig}
            kind="order"
            className="absolute right-4 sm:right-6"
          />
        ) : null}
      </div>
    </header>
  )
}
