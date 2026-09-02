import type { SupportedLocale } from '@/i18n/locale'

/** Stored in jsonb / block config — plain string (legacy) or per-locale map. */
export type LocalizedString =
  | string
  | Record<string, string | boolean | undefined>
  | null
  | undefined

export function otherStoreLocale(locale: SupportedLocale): SupportedLocale {
  return locale === 'vi' ? 'en' : 'vi'
}

function pickFromRecord(
  record: Record<string, unknown>,
  locale: SupportedLocale,
  primary: SupportedLocale,
): string {
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

/** Read text for a locale; falls back to primary when secondary is empty. */
export function readLocaleText(
  value: LocalizedString,
  locale: SupportedLocale,
  primary: SupportedLocale,
): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  return pickFromRecord(value as Record<string, unknown>, locale, primary)
}

/** Seed primary + secondary with the same plain text (setup / enable dual). */
export function seedLocalizedPair(
  value: LocalizedString,
  primary: SupportedLocale,
  secondary: SupportedLocale,
): Record<string, string> {
  const text = readLocaleText(value, primary, primary)
  return { [primary]: text, [secondary]: text }
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
