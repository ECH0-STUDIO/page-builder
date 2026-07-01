'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { SupportedLocale } from '@/i18n/locale'
import { marketingPathForLocale } from '@/lib/marketing-locale'

export function MarketingLocaleSwitcher({ locale }: { locale: SupportedLocale }) {
  const pathname = usePathname() || '/'
  const locales: SupportedLocale[] = ['vi', 'en']

  return (
    <div className="marketing-locale-switcher" data-marketing-locale>
      {locales.map((l) => (
        <Link
          key={l}
          href={marketingPathForLocale(pathname, l)}
          className={`marketing-locale-link${l === locale ? ' is-active' : ''}`}
          hrefLang={l}
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </div>
  )
}
