import type { SupportedLocale } from '@/i18n/locale'
import {
  getCustomizedFlags,
  isLocaleCustomized,
  otherStoreLocale,
  readLocaleText,
  type LocalizedMap,
  type LocalizedString,
} from '@/i18n/localized-content'

/** Build string locale map from stored value (preserves _customized separately). */
export function baseLocaleMap(
  value: LocalizedString,
  primary: SupportedLocale,
  secondary: SupportedLocale,
): Record<string, string> {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    )
  }
  const text = typeof value === 'string' ? value : ''
  return { [primary]: text, [secondary]: '' }
}

/** Read text in the editor — falls back to primary until this locale is customized. */
export function readEditorLocaleText(
  value: LocalizedString,
  locale: SupportedLocale,
  primary: SupportedLocale,
): string {
  return readLocaleText(value, locale, primary)
}

/**
 * Write one locale slice. Marks the locale as customized so it no longer inherits primary.
 * Other customized locales are never overwritten.
 */
export function writeLocaleText(
  value: LocalizedString,
  locale: SupportedLocale,
  text: string,
  primary: SupportedLocale,
): LocalizedString {
  const secondary = otherStoreLocale(primary)
  const existingRecord =
    value != null && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null

  const stringEntries = baseLocaleMap(value, primary, secondary)
  const flags = getCustomizedFlags(existingRecord ?? stringEntries)

  const next: LocalizedMap = { ...stringEntries, [locale]: text }
  next._customized = { ...flags, [locale]: true }

  // Primary edit: drop stale legacy duplicate in secondary when secondary is still untranslated.
  if (locale === primary && !isLocaleCustomized(value, secondary, primary)) {
    next[secondary] = ''
  }

  return next
}

/** Plain string for legacy DB columns — always the primary locale text. */
export function primaryPlainText(
  value: LocalizedString,
  primary: SupportedLocale,
): string {
  return readLocaleText(value, primary, primary)
}

/** Resolve localized content for display (editor and live use the same fallback rules). */
export function resolveContentText(
  value: LocalizedString,
  locale: SupportedLocale,
  primary: SupportedLocale,
): string {
  return readLocaleText(value, locale, primary)
}
