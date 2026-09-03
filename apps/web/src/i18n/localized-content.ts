/**
 * Per-locale jsonb text maps for storefront content (any purchased store locale).
 */

export type LocalizedMap = Record<string, string | boolean | Record<string, boolean> | undefined>

export type LocalizedString =
  | string
  | LocalizedMap
  | null
  | undefined

export function getCustomizedFlags(
  record: Record<string, unknown> | null | undefined,
): Record<string, boolean> {
  if (!record) return {}
  const raw = record._customized
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).filter(
      (entry): entry is [string, boolean] => entry[1] === true,
    ),
  )
}

export function isLocaleCustomized(
  value: LocalizedString,
  locale: string,
  primary: string,
): boolean {
  if (value == null) return false
  if (typeof value === 'string') return locale === primary

  const record = value as Record<string, unknown>
  const flags = getCustomizedFlags(record)
  if (flags[locale]) return true

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
  locale: string,
  primary: string,
): string {
  const customized = getCustomizedFlags(record)

  if (customized[locale]) {
    const direct = record[locale]
    return typeof direct === 'string' ? direct : ''
  }

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

/** Read text for a locale — untranslated locales fall back to primary. */
export function readLocaleText(
  value: LocalizedString,
  locale: string,
  primary: string,
): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  return pickFromRecord(value as Record<string, unknown>, locale, primary)
}

/**
 * Write one locale slice. Marks the locale as customized.
 * Never overwrites other customized locales.
 */
export function writeLocaleText(
  value: LocalizedString,
  locale: string,
  text: string,
  primary: string,
): LocalizedMap {
  const existingRecord =
    value != null && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null

  const stringEntries: Record<string, string> = {}
  if (existingRecord) {
    for (const [k, v] of Object.entries(existingRecord)) {
      if (typeof v === 'string') stringEntries[k] = v
    }
  } else if (typeof value === 'string') {
    stringEntries[primary] = value
  }

  if (stringEntries[primary] === undefined) {
    stringEntries[primary] = typeof value === 'string' ? value : ''
  }

  const flags = getCustomizedFlags(existingRecord ?? stringEntries)
  const next: LocalizedMap = { ...stringEntries, [locale]: text }
  next._customized = { ...flags, [locale]: true }
  return next
}

export function primaryPlainText(value: LocalizedString, primary: string): string {
  return readLocaleText(value, primary, primary)
}

export function resolveContentText(
  value: LocalizedString,
  locale: string,
  primary: string,
): string {
  return readLocaleText(value, locale, primary)
}
