import type { SupportedLocale } from '@/i18n/locale'

/** Stored in jsonb / block config — plain string (legacy) or per-locale map. */
export type LocalizedMap = Record<string, string | boolean | Record<string, boolean> | undefined>

export type LocalizedString =
  | string
  | LocalizedMap
  | null
  | undefined

export function otherStoreLocale(locale: SupportedLocale): SupportedLocale {
  return locale === 'vi' ? 'en' : 'vi'
}

export function getCustomizedFlags(
  record: Record<string, unknown> | null | undefined,
): Record<string, boolean> {
  if (!record) return {}
  const raw = record._customized
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).filter((entry): entry is [string, boolean] => entry[1] === true),
  )
}

/**
 * True when this locale has its own translation (explicitly edited).
 * Untranslated locales fall back to primary in the editor and on the live site.
 */
export function isLocaleCustomized(
  value: LocalizedString,
  locale: SupportedLocale,
  primary: SupportedLocale,
): boolean {
  if (value == null) return false
  if (typeof value === 'string') return locale === primary

  const record = value as Record<string, unknown>
  const flags = getCustomizedFlags(record)
  if (flags[locale]) return true

  // Legacy: secondary text that differs from primary was an explicit translation.
  if (locale !== primary) {
    const direct = record[locale]
    const primaryText = record[primary]
    if (
      typeof direct === 'string'
      && typeof primaryText === 'string'
      && direct.trim()
      && direct !== primaryText
    ) {
      return true
    }
    return false
  }

  return typeof record[primary] === 'string'
}

function pickFromRecord(
  record: Record<string, unknown>,
  locale: SupportedLocale,
  primary: SupportedLocale,
): string {
  const customized = getCustomizedFlags(record)

  // Customized locale — use stored value as-is (including intentional empty string).
  if (customized[locale]) {
    const direct = record[locale]
    return typeof direct === 'string' ? direct : ''
  }

  // Not customized — Webflow-style fallback to primary for secondary locales.
  if (locale !== primary) {
    const primaryText = record[primary]
    if (typeof primaryText === 'string') return primaryText
  }

  const direct = record[locale]
  if (typeof direct === 'string' && direct.trim()) return direct

  const prim = record[primary]
  if (typeof prim === 'string' && prim.trim()) return prim

  for (const [key, value] of Object.entries(record)) {
    if (key === '_customized') continue
    if (typeof value === 'string' && value.trim()) return value
  }
  return ''
}

/**
 * Read text for a locale.
 * Untranslated secondary locales fall back to primary (Webflow localization model).
 */
export function readLocaleText(
  value: LocalizedString,
  locale: SupportedLocale,
  primary: SupportedLocale,
): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  return pickFromRecord(value as Record<string, unknown>, locale, primary)
}

/** Seed primary only — secondary starts untranslated (falls back until edited). */
export function seedLocalizedPair(
  value: LocalizedString,
  primary: SupportedLocale,
  secondary: SupportedLocale,
): LocalizedMap {
  const text = readLocaleText(value, primary, primary)
  return { [primary]: text, [secondary]: '', _customized: { [primary]: true } }
}

/** True when value is already a locale map with both keys populated. */
export function hasBothLocaleTexts(
  value: LocalizedString,
  primary: SupportedLocale,
  secondary: SupportedLocale,
): boolean {
  if (value == null || typeof value === 'string') return false
  const record = value as Record<string, unknown>
  const a = record[primary]
  const b = record[secondary]
  return typeof a === 'string' && typeof b === 'string'
}
