import { STORE_LOCALE_CODES } from '@/i18n/store-locales'

/**
 * Internal `/loc/{locale}/...` tree (public URLs stay `/{locale}/...` via
 * next.config rewrite). Isolating this from app-root `[slug]` lets
 * `/{storeSlug}/order` match the static `order` segment.
 */
export const dynamicParams = false

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
