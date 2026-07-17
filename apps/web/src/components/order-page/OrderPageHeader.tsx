'use client'

/**
 * Compact sticky header for the order page — logo, table badge, link to landing.
 */

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from '@/i18n/I18nProvider'

interface OrderPageHeaderProps {
  slug: string
  businessName: string
  logoUrl?: string | null
  brandColor: string
}

export function OrderPageHeader({ slug, businessName, logoUrl, brandColor }: OrderPageHeaderProps) {
  const searchParams = useSearchParams()
  const table = (searchParams.get('table') ?? '').trim()
  const { t } = useTranslation()

  return (
    <header
      className="sticky top-0 z-40 border-b border-black/6 backdrop-blur-md"
      style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}
    >
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-4 sm:px-6">
        <Link
          href={`/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors shrink-0"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">{t('orderPage.backToPage')}</span>
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-2.5">
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
          <span className="truncate text-sm font-semibold text-gray-900 tracking-tight">
            {businessName}
          </span>
        </div>

        <div className="shrink-0 min-w-[4.5rem] flex justify-end">
          {table ? (
            <span
              className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold text-white"
              style={{ backgroundColor: brandColor }}
            >
              {t('orderPage.table')} {table}
            </span>
          ) : (
            <span className="text-xs font-medium text-gray-400">{t('orderPage.order')}</span>
          )}
        </div>
      </div>
    </header>
  )
}
