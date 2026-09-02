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

function readPrimaryEditorText(
  value: LocalizedString,
  primary: SupportedLocale,
): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  const direct = (value as Record<string, unknown>)[primary]
  return typeof direct === 'string' ? direct : ''
}

/**
 * Read text in the editor — no cross-locale fallback.
 * Secondary tab shows empty until secondary text is entered.
 * Legacy dual-language setup copied primary into secondary; treat identical copies as untranslated.
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
  const text = typeof direct === 'string' ? direct : ''
  if (locale !== primary && text) {
    const primaryText = readPrimaryEditorText(value, primary)
    if (primaryText && text === primaryText) return ''
  }
  return text
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
  const next = { ...base, [locale]: text }
  // Drop legacy seeded duplicate when primary text changes (old setup copied vi → en).
  if (locale === primary) {
    const previousPrimary = base[primary] ?? ''
    if (next[secondary] === previousPrimary) {
      next[secondary] = ''
    }
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

/**
 * Resolve localized content for display.
 * Editor mode: strict per-locale (no fallback). Live/preview: primary fallback.
 */
export function resolveContentText(
  value: LocalizedString,
  locale: SupportedLocale,
  primary: SupportedLocale,
  options?: { editorMode?: boolean },
): string {
  if (options?.editorMode) {
    return readEditorLocaleText(value, locale, primary)
  }
  return readLocaleText(value, locale, primary)
}
