import { plainText, type LegacyLocalized } from './locale-content'
import { readLocaleText } from './localized-content'

/** Locales supported for system UI (dashboard, cart, auth). */
export const SUPPORTED_LOCALES = ['vi', 'en'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return value === 'vi' || value === 'en'
}

export function toSupportedLocale(locale: string | null | undefined): SupportedLocale {
  return isSupportedLocale(locale) ? locale : 'vi'
}

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
}

export interface ResolveLiveLocaleOptions {
  /** Locale from URL prefix (/en/{slug}) */
  pathLocale?: SupportedLocale | null
  /** Store primary locale (publishing_settings.language) */
  storePrimary?: string | null
  /** Whether dual language is enabled for this store */
  dualEnabled?: boolean
}

/**
 * Resolve which locale to use for live store content.
 * Unprefixed URLs always serve the store primary locale.
 * Prefixed URLs serve the path locale when dual language is on.
 */
export function resolveLiveLocale(options: ResolveLiveLocaleOptions): SupportedLocale {
  const primary = toSupportedLocale(options.storePrimary)
  if (options.pathLocale && isSupportedLocale(options.pathLocale)) {
    return options.pathLocale
  }
  return primary
}

/** Read localized block/menu text for a visitor locale with primary fallback. */
export function pickLocale(
  value: LegacyLocalized,
  locale: SupportedLocale,
  primary: SupportedLocale = 'vi',
): string {
  return readLocaleText(value, locale, primary)
}

export { plainText, type LegacyLocalized }
