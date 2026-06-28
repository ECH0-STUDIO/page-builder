import { plainText, type LegacyLocalized } from './locale-content'

/** Locales supported for system UI (dashboard, cart, auth). */
export const SUPPORTED_LOCALES = ['vi', 'en'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return value === 'vi' || value === 'en'
}

/** Live store content is single-language for MVP. */
export function resolveLiveLocale(
  _cookieLocale?: string | null,
  _storeDefaultLocale?: string | null,
): SupportedLocale {
  return 'vi'
}

export function toSupportedLocale(locale: string | null | undefined): SupportedLocale {
  return isSupportedLocale(locale) ? locale : 'vi'
}

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
}

/** @deprecated Use plainText — kept for gradual migration of legacy locale-map configs. */
export function pickLocale(value: LegacyLocalized, _locale?: string): string {
  return plainText(value)
}

export { plainText, type LegacyLocalized }
