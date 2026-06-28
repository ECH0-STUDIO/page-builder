import type { Locale } from './getDictionary'
import {
  getLocalizedField,
  pickLocale as pickLocaleContent,
  primaryLocalizedValue as primaryLocalizedValueContent,
  setLocalizedField,
  type LocalizedValue,
  type LocaleStringMap,
} from './locale-content'

/** Locales supported for system UI (dashboard, cart, auth). */
export const SUPPORTED_LOCALES = ['vi', 'en'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export type MenuI18nMap = Partial<Record<string, string>>

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return value === 'vi' || value === 'en'
}

/**
 * Resolve the active locale for a live store visitor.
 * One locale at a time — never mixed.
 */
export function resolveLiveLocale(
  cookieLocale: string | null | undefined,
  storeDefaultLocale: string | null | undefined,
): SupportedLocale {
  if (isSupportedLocale(cookieLocale)) return cookieLocale
  if (isSupportedLocale(storeDefaultLocale)) return storeDefaultLocale
  return 'vi'
}

export type { LocalizedValue, LocaleStringMap }
export { getLocalizedField, setLocalizedField }

/**
 * Pick a single string for the active locale from plain or i18n-shaped values.
 */
export function pickLocale(
  value: LocalizedValue,
  locale: string,
  enabledLocales: string[] = ['vi', 'en'],
): string {
  return pickLocaleContent(value, locale, enabledLocales)
}

export function primaryLocalizedValue(
  map: LocaleStringMap | Record<string, string>,
  primaryLocale: string = 'vi',
): string {
  return primaryLocalizedValueContent(map, primaryLocale)
}

export function toSupportedLocale(locale: string | null | undefined): SupportedLocale {
  return isSupportedLocale(locale) ? locale : 'vi'
}

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
}

/** Whether a menu row is shown for the given content locale. */
export function isVisibleInLocale(
  visibleLocales: string[] | null | undefined,
  locale: string,
): boolean {
  if (!visibleLocales || visibleLocales.length === 0) return true
  return visibleLocales.includes(locale)
}
