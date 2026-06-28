import type { Locale } from './getDictionary'

/** Locales supported on live stores and in the page builder. */
export const SUPPORTED_LOCALES = ['vi', 'en'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

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

export type LocalizedValue = string | Partial<Record<SupportedLocale, string>> | null | undefined

/**
 * Pick a single string for the active locale from plain or i18n-shaped values.
 * Falls back to the other supported locale, then to fallback string.
 */
export function pickLocale(
  value: LocalizedValue,
  locale: SupportedLocale,
  fallbackLocale: SupportedLocale = locale === 'vi' ? 'en' : 'vi',
): string {
  if (value == null) return ''
  if (typeof value === 'string') return value

  const primary = value[locale]?.trim()
  if (primary) return primary

  const secondary = value[fallbackLocale]?.trim()
  if (secondary) return secondary

  return Object.values(value).find(v => typeof v === 'string' && v.trim())?.trim() ?? ''
}

export function toSupportedLocale(locale: string | null | undefined): SupportedLocale {
  return isSupportedLocale(locale) ? locale : 'vi'
}

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
}

/** Read the string for a single edit locale from plain or i18n-shaped values. */
export function getLocalizedField(value: LocalizedValue, locale: SupportedLocale): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  return value[locale] ?? ''
}

/** Write one locale slice; upgrades plain strings to `{ vi, en }` shape. */
export function setLocalizedField(
  value: LocalizedValue,
  locale: SupportedLocale,
  text: string,
): Record<SupportedLocale, string> {
  const next: Record<SupportedLocale, string> = {
    vi: typeof value === 'object' && value ? (value.vi ?? '') : typeof value === 'string' ? value : '',
    en: typeof value === 'object' && value ? (value.en ?? '') : typeof value === 'string' ? value : '',
  }
  next[locale] = text
  return next
}

/** Primary legacy column value — prefer Vietnamese, then English. */
export function primaryLocalizedValue(value: LocalizedValue): string {
  return pickLocale(value, 'vi', 'en')
}

export type MenuI18nMap = Partial<Record<SupportedLocale, string>>

export function buildMenuI18nPayload(
  existing: MenuI18nMap | string | null | undefined,
  legacy: string | null | undefined,
  locale: SupportedLocale,
  text: string,
): MenuI18nMap {
  const base = typeof existing === 'object' && existing
    ? { ...existing }
    : legacy
      ? { vi: legacy, en: legacy }
      : {}
  return { ...base, [locale]: text.trim() }
}
