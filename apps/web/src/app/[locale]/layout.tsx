import { STORE_LOCALE_CODES } from '@/i18n/store-locales'

/**
 * Prefetch known storefront locale segments.
 *
 * Do not set `dynamicParams = false` here. `/la-matcha/order` is wrongly matched
 * as this `[locale]` tree; a hard 404 at the layout would skip the recovery
 * shim in `[locale]/[slug]/page.tsx` that renders the real order page.
 */
export function generateStaticParams() {
  return STORE_LOCALE_CODES.map(locale => ({ locale }))
}

export default function StoreLocaleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
