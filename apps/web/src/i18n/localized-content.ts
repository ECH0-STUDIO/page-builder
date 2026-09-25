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

export function isLocalizedMap(value: unknown): value is LocalizedMap {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Point the primary-language slice at the text the page builder / menu just saved.
 * Other locales and their customized flags stay untouched.
 * A plain string is returned when nothing has been translated yet.
 */
export function setPrimaryLocaleText(
  value: LocalizedString,
  text: string,
  primary: string,
): LocalizedString {
  if (!isLocalizedMap(value)) return text
  const flags = getCustomizedFlags(value as Record<string, unknown>)
  const hasOtherLocale = Object.entries(value).some(([key, entry]) => {
    if (key === '_customized' || key === primary) return false
    return typeof entry === 'string' && entry.trim().length > 0
  })
  const hasCustomTranslation = Object.entries(flags).some(([key, on]) => key !== primary && on)
  if (!hasOtherLocale && !hasCustomTranslation) return text
  return { ...value, [primary]: text, _customized: flags }
}

/** Use the builder/menu column when it has text. Leave stored copy alone when the column is empty. */
export function overlayLivePrimary(
  stored: LocalizedString,
  live: string | null | undefined,
  primary: string,
): LocalizedString {
  if (live == null || !String(live).trim()) return stored ?? ''
  return setPrimaryLocaleText(stored ?? '', live, primary)
}

/** Drop one locale's custom translation so it follows the primary text again. */
export function resetLocaleText(
  value: LocalizedString,
  locale: string,
  primary: string,
): LocalizedMap {
  const record: Record<string, unknown> = isLocalizedMap(value)
    ? { ...(value as Record<string, unknown>) }
    : { [primary]: typeof value === 'string' ? value : '' }

  if (typeof record[primary] !== 'string') {
    record[primary] = primaryPlainText(value, primary)
  }
  if (locale !== primary) delete record[locale]

  const flags = getCustomizedFlags(record)
  if (locale !== primary) delete flags[locale]

  const next: LocalizedMap = {}
  for (const [key, entry] of Object.entries(record)) {
    if (key === '_customized') continue
    if (typeof entry === 'string') next[key] = entry
  }
  if (typeof next[primary] !== 'string') next[primary] = ''
  next._customized = flags
  return next
}

/**
 * Write a translation, or clear it when `text` is null (reset to primary).
 * `livePrimary` is the current source text from the builder/menu when it lives
 * in a separate column from the locale map.
 */
export function applyLocaleChange(
  existing: LocalizedString,
  locale: string,
  text: string | null,
  primary: string,
  livePrimary?: string | null,
): LocalizedMap {
  const base = livePrimary !== undefined
    ? setPrimaryLocaleText(existing ?? '', livePrimary ?? '', primary)
    : existing
  if (text === null) return resetLocaleText(base, locale, primary)
  return writeLocaleText(base, locale, text, primary)
}

const LOCALIZED_TEXT_KEYS = ['heading', 'body', 'description', 'label', 'copyright_text'] as const

function firstLocaleMap(values: unknown[]): LocalizedMap | null {
  for (const value of values) {
    if (isLocalizedMap(value)) return value
  }
  return null
}

function mergeTextValue(incoming: unknown, primary: string, previous: unknown[]): unknown {
  if (typeof incoming !== 'string') return incoming
  const map = firstLocaleMap(previous)
  if (!map) return incoming
  return setPrimaryLocaleText(map, incoming, primary)
}

/**
 * Keep translated slices when the builder saves a plain string over a locale map.
 * `fallbacks` are older copies (draft row, then last published snapshot).
 */
export function syncLocalizedConfig<T extends Record<string, unknown>>(
  incoming: T,
  primary: string,
  fallbacks: Array<Record<string, unknown> | null | undefined>,
): T {
  const prevs = fallbacks.filter(
    (row): row is Record<string, unknown> => !!row && typeof row === 'object' && !Array.isArray(row),
  )
  const next: Record<string, unknown> = { ...incoming }

  for (const key of LOCALIZED_TEXT_KEYS) {
    if (!(key in next)) continue
    next[key] = mergeTextValue(next[key], primary, prevs.map(row => row[key]))
  }

  for (const ctaKey of ['cta', 'cta_secondary'] as const) {
    const cta = next[ctaKey]
    if (!cta || typeof cta !== 'object' || Array.isArray(cta)) continue
    const ctaRec = { ...(cta as Record<string, unknown>) }
    const prevCtas = prevs
      .map(row => row[ctaKey])
      .filter((row): row is Record<string, unknown> => isLocalizedMap(row))
    if ('label' in ctaRec) {
      ctaRec.label = mergeTextValue(ctaRec.label, primary, prevCtas.map(row => row.label))
    }
    next[ctaKey] = ctaRec
  }

  if (Array.isArray(next.links)) {
    next.links = next.links.map((link, index) => {
      if (!link || typeof link !== 'object' || Array.isArray(link)) return link
      const rec = { ...(link as Record<string, unknown>) }
      const prevLabels = prevs.map(row => {
        const links = row.links
        if (!Array.isArray(links)) return undefined
        const item = links[index]
        if (!isLocalizedMap(item)) return undefined
        return item.label
      })
      if ('label' in rec) rec.label = mergeTextValue(rec.label, primary, prevLabels)
      return rec
    })
  }

  return next as T
}

export function resolveContentText(
  value: LocalizedString,
  locale: string,
  primary: string,
): string {
  return readLocaleText(value, locale, primary)
}
