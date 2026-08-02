/** Shared normalization for marketing VI → EN manifest keys. */

export function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

export function encodeHtmlTextEntities(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Add &amp; / decoded alias keys so manifest matches Webflow HTML text nodes. */
export function expandEntityAliases(pairs) {
  for (const [vi, en] of Object.entries({ ...pairs })) {
    if (!en) continue
    if (vi.includes('&') && !vi.includes('&amp;')) {
      pairs[vi.replace(/&/g, '&amp;')] = en
    }
    if (vi.includes('&amp;') && !pairs[vi.replace(/&amp;/g, '&')]) {
      pairs[vi.replace(/&amp;/g, '&')] = en
    }
  }
  return pairs
}

export function normalizeKey(s) {
  return decodeEntities(s).replace(/\s+/g, ' ').trim().toLowerCase()
}

/** Map normalized Vietnamese text → English translation. */
export function buildTranslationIndex(pairs) {
  const index = new Map()
  for (const [vi, en] of Object.entries(pairs)) {
    if (!en) continue
    index.set(normalizeKey(vi), en)
  }
  return index
}

export function resolveTranslation(vi, pairs) {
  const direct = pairs[vi]
  if (direct) return direct
  return buildTranslationIndex(pairs).get(normalizeKey(vi)) ?? null
}

/** Fill null / missing entries using normalized matches against known translations. */
export function fillNullTranslations(pairs) {
  const index = buildTranslationIndex(pairs)
  let filled = 0
  for (const [vi, en] of Object.entries(pairs)) {
    if (en) continue
    const resolved = index.get(normalizeKey(vi))
    if (resolved) {
      pairs[vi] = resolved
      filled++
    }
  }
  return filled
}
