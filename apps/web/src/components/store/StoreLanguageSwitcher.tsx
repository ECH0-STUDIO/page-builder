'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  buildCustomDomainStorePath,
  buildStorePublicPath,
  isStoreLocaleCode,
  storeLocaleLabel,
  type StoreLocaleCode,
} from '@/i18n/store-locales'

/** True when the browser URL is a custom-domain path (no /{slug} segment). */
function isOnCustomDomain(pathname: string, slug: string): boolean {
  const segments = pathname.split('/').filter(Boolean)
  const clean = slug.replace(/^\/+/, '')
  if (segments[0] === clean) return false
  if (isStoreLocaleCode(segments[0]) && segments[1] === clean) return false
  return true
}

export function StoreLanguageSwitcher({
  slug,
  primary,
  locales,
  kind = 'landing',
}: {
  slug: string
  primary: StoreLocaleCode
  locales: StoreLocaleCode[]
  /** @deprecated inferred from pathname */
  current?: StoreLocaleCode
  kind?: 'landing' | 'order'
}) {
  const pathname = usePathname() || ''
  const searchParams = useSearchParams()
  if (locales.length < 2) return null

  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0]
  const onCustomDomain = isOnCustomDomain(pathname, slug)
  const inferred: StoreLocaleCode =
    isStoreLocaleCode(first) && (onCustomDomain || first !== slug) && locales.includes(first)
      ? first
      : primary

  const query = searchParams?.toString()
  const qs = query ? `?${query}` : ''
  const onOrder = kind === 'order' || pathname.includes('/order')

  return (
    <div
      className="fixed bottom-4 right-4 z-40 flex items-center gap-1 rounded-full border border-black/10 bg-white/95 p-1 shadow-lg backdrop-blur"
      role="navigation"
      aria-label="Language"
    >
      {locales.map(locale => {
        const href = `${
          onCustomDomain
            ? buildCustomDomainStorePath({
                locale,
                primary,
                kind: onOrder ? 'order' : 'landing',
              })
            : buildStorePublicPath(slug, {
                locale,
                primary,
                kind: onOrder ? 'order' : 'landing',
              })
        }${qs}`
        const active = locale === inferred
        return (
          <Link
            key={locale}
            href={href}
            className={cn(
              'px-2.5 py-1 text-xs font-medium rounded-full transition-colors',
              active
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
            )}
            hrefLang={locale}
          >
            {storeLocaleLabel(locale)}
          </Link>
        )
      })}
    </div>
  )
}
