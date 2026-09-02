import type { SupportedLocale } from '@/i18n/locale'
import {
  otherStoreLocale,
  readLocaleText,
  seedLocalizedPair,
  type LocalizedString,
} from '@/i18n/localized-content'

/** Write one locale slice; preserves other locales in the map. */
export function writeLocaleText(
  value: LocalizedString,
  locale: SupportedLocale,
  text: string,
  primary: SupportedLocale,
): Record<string, string> {
  const secondary = otherStoreLocale(primary)
  const base =
    value != null && typeof value === 'object' && !Array.isArray(value)
      ? Object.fromEntries(
          Object.entries(value as Record<string, unknown>).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string',
          ),
        )
      : seedLocalizedPair(value, primary, secondary)
  return { ...base, [locale]: text }
}

/** Plain string for legacy DB columns — always the primary locale text. */
export function primaryPlainText(
  value: LocalizedString,
  primary: SupportedLocale,
): string {
  return readLocaleText(value, primary, primary)
}
