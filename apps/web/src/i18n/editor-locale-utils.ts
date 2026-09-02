import type { SupportedLocale } from '@/i18n/locale'
import {
  otherStoreLocale,
  readLocaleText,
  type LocalizedString,
} from '@/i18n/localized-content'

/** Build a locale map from stored value without copying primary into secondary. */
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

/**
 * Read text in the editor — no cross-locale fallback.
 * Secondary tab shows empty until secondary text is entered.
 */
export function readEditorLocaleText(
  value: LocalizedString,
  locale: SupportedLocale,
  primary: SupportedLocale,
): string {
  if (value == null) return ''
  if (typeof value === 'string') {
    return locale === primary ? value : ''
  }
  const direct = (value as Record<string, unknown>)[locale]
  return typeof direct === 'string' ? direct : ''
}

/** Write one locale slice; preserves other locales in the map. */
export function writeLocaleText(
  value: LocalizedString,
  locale: SupportedLocale,
  text: string,
  primary: SupportedLocale,
): Record<string, string> {
  const secondary = otherStoreLocale(primary)
  const base = baseLocaleMap(value, primary, secondary)
  return { ...base, [locale]: text }
}

/** Plain string for legacy DB columns — always the primary locale text. */
export function primaryPlainText(
  value: LocalizedString,
  primary: SupportedLocale,
): string {
  return readLocaleText(value, primary, primary)
}
