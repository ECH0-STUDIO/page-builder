import type { SupportedLocale } from './locale'

export type LocaleStringMap = Partial<Record<string, string>> & {
  _customized?: Partial<Record<string, boolean>>
}

export type LocalizedValue = string | LocaleStringMap | null | undefined

/** Strip meta keys before persisting menu i18n columns. */
export function stripLocalizedMeta(map: LocaleStringMap): Record<string, string> {
  const { _customized, ...rest } = map
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(rest)) {
    if (typeof v === 'string') out[k] = v
  }
  return out
}

export function pickLocale(
  value: LocalizedValue,
  locale: string,
  enabledLocales: string[] = ['vi', 'en'],
): string {
  if (value == null) return ''
  if (typeof value === 'string') return value

  const primary = value[locale]?.trim()
  if (primary) return primary

  for (const l of enabledLocales) {
    const v = value[l]?.trim()
    if (v) return v
  }

  return Object.entries(value)
    .filter(([k]) => k !== '_customized')
    .map(([, v]) => (typeof v === 'string' ? v.trim() : ''))
    .find(Boolean) ?? ''
}

export function getLocalizedField(
  value: LocalizedValue,
  locale: string,
  enabledLocales: string[] = ['vi', 'en'],
): string {
  return pickLocale(value, locale, enabledLocales)
}

/**
 * Copy-on-write: editing the primary locale propagates to linked locales;
 * editing another locale marks it customized.
 */
export function setLocalizedField(
  value: LocalizedValue,
  locale: string,
  text: string,
  enabledLocales: string[],
  primaryLocale: string,
): LocaleStringMap {
  const base = normalizeLocalizedMap(value, enabledLocales)
  const customized = { ...(base._customized ?? {}) }
  const map: LocaleStringMap = { ...base }
  delete map._customized

  map[locale] = text

  if (locale === primaryLocale) {
    for (const l of enabledLocales) {
      if (l !== locale && !customized[l]) {
        map[l] = text
      }
    }
  } else {
    customized[locale] = true
  }

  if (Object.keys(customized).length > 0) {
    map._customized = customized
  }

  return map
}

function normalizeLocalizedMap(
  value: LocalizedValue,
  enabledLocales: string[],
): LocaleStringMap {
  if (typeof value === 'string') {
    const map: LocaleStringMap = {}
    for (const l of enabledLocales) map[l] = value
    return map
  }
  if (!value || typeof value !== 'object') {
    const map: LocaleStringMap = {}
    for (const l of enabledLocales) map[l] = ''
    return map
  }
  return { ...value }
}

export function primaryLocalizedValue(
  map: LocaleStringMap | Record<string, string>,
  primaryLocale: string = 'vi',
): string {
  const primary = map[primaryLocale]?.trim()
  if (primary) return primary
  const fallback = Object.entries(map)
    .filter(([k]) => k !== '_customized')
    .map(([, v]) => (typeof v === 'string' ? v.trim() : ''))
    .find(Boolean)
  return fallback ?? ''
}

export const OPTIONAL_LOCALES: { code: string; label: string }[] = [
  { code: 'th', label: 'ไทย' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'ms', label: 'Bahasa Melayu' },
]

export const DEFAULT_ENABLED_LOCALES: SupportedLocale[] = ['vi', 'en']
export const LOCALE_CREDIT_COST_PER_MONTH = 20

/** Ensure seo_i18n is a plain JSON object safe for server actions + Postgres jsonb. */
export function sanitizeSeoI18nForDb(
  store: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!store || typeof store !== 'object') return null
  try {
    return JSON.parse(JSON.stringify(store)) as Record<string, unknown>
  } catch {
    return null
  }
}

export function isLocaleColumnSchemaError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('enabled_locales')
    || m.includes('seo_i18n')
    || m.includes('name_i18n')
    || m.includes('visible_locales')
    || m.includes('schema cache')
  )
}
