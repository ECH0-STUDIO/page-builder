/** Legacy block config values may still be locale maps in the database. */
export type LegacyLocalized = string | Record<string, string | boolean | undefined> | null | undefined

/** Read a plain string from legacy string or locale-map JSON. */
export function plainText(value: LegacyLocalized): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  const record = value as Record<string, unknown>
  const vi = record.vi
  if (typeof vi === 'string' && vi) return vi
  for (const [k, v] of Object.entries(record)) {
    if (k !== '_customized' && typeof v === 'string' && v) return v
  }
  return ''
}
