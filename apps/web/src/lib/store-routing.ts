import type { SupportedLocale } from '@/i18n/locale'
import { isSupportedLocale, toSupportedLocale } from '@/i18n/locale'
import { otherStoreLocale } from '@/i18n/localized-content'
import {
  buildStorePublicPath,
  parseStoreLanguageConfig,
  type StoreLanguageConfig,
  type StorePublicPathKind,
} from '@/i18n/store-locale'

export function languageConfigFromPublishing(row: {
  language?: string | null
  dual_language_enabled?: boolean | null
  dual_language_setup_status?: string | null
  enabled_locales?: string[] | null
} | null | undefined): StoreLanguageConfig {
  return parseStoreLanguageConfig(row)
}

/** Redirect unprefixed primary-locale URLs (/vi/slug when VI is primary). */
export function shouldRedirectPrimaryPrefixedUrl(
  pathLocale: SupportedLocale,
  config: StoreLanguageConfig,
): boolean {
  return pathLocale === config.primary_locale
}

/** Secondary URL used when dual is off — redirect to primary path. */
export function shouldRedirectSecondaryWhenDualOff(
  pathLocale: SupportedLocale | null,
  config: StoreLanguageConfig,
): boolean {
  if (!pathLocale || config.dual_language_enabled) return false
  return pathLocale !== config.primary_locale
}

/** Unknown locale prefix on a store path. */
export function isValidStorePathLocale(
  pathLocale: SupportedLocale,
  config: StoreLanguageConfig,
): boolean {
  if (!config.dual_language_enabled) return false
  return (
    pathLocale === config.primary_locale || pathLocale === config.secondary_locale
  )
}

export function resolveStorePathLocale(
  pathLocale: string | undefined,
  config: StoreLanguageConfig,
): SupportedLocale | null {
  if (!pathLocale || !isSupportedLocale(pathLocale)) return null
  if (!isValidStorePathLocale(pathLocale, config)) return null
  return pathLocale
}

export function storePublicPathForLocale(
  slug: string,
  config: StoreLanguageConfig,
  kind: StorePublicPathKind = 'landing',
  targetLocale?: SupportedLocale,
): string {
  const locale = targetLocale ?? config.primary_locale
  return buildStorePublicPath(slug, {
    locale,
    primary: config.primary_locale,
    dualEnabled: config.dual_language_enabled,
    kind,
  })
}

export function alternateStoreLocale(
  current: SupportedLocale,
  config: StoreLanguageConfig,
): SupportedLocale | null {
  if (!config.dual_language_enabled) return null
  const other = otherStoreLocale(config.primary_locale)
  return current === config.primary_locale ? other : config.primary_locale
}

/**
 * Rewrite custom-domain paths to internal app routes.
 * / → /{slug}, /order → /{slug}/order, /en → /en/{slug}, /en/order → /en/{slug}/order
 */
export function rewriteCustomDomainStorePath(
  pathname: string,
  slug: string,
): string {
  if (pathname === '/' || pathname === '') return `/${slug}`

  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0]

  if (first === 'en' || first === 'vi') {
    const rest = segments.slice(1).join('/')
    return rest ? `/${first}/${slug}/${rest}` : `/${first}/${slug}`
  }

  const suffix = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `/${slug}${suffix}`
}
