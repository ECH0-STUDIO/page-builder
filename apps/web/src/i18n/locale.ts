import { plainText, type LegacyLocalized } from './locale-content'
import { readLocaleText, type LocalizedString } from './localized-content'

/** Locales supported for system UI (dashboard, cart, auth). */
export const SUPPORTED_LOCALES = ['vi', 'en'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return value === 'vi' || value === 'en'
}

/** Live store content locale — prefers store primary when provided. */
export function resolveLiveLocale(
  _cookieLocale?: string | null,
  storeDefaultLocale?: string | null,
): SupportedLocale {
  return toSupportedLocale(storeDefaultLocale)
}

export function toSupportedLocale(locale: string | null | undefined): SupportedLocale {
  return isSupportedLocale(locale) ? locale : 'vi'
}

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
}

/** Read localized storefront text with primary fallback. */
export function pickLocale(
  value: LegacyLocalized,
  locale?: string,
  primary: string = 'vi',
): string {
  const target = locale || primary
  return readLocaleText(value as LocalizedString, target, primary)
}

export { plainText, type LegacyLocalized }
