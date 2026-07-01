import type { SupportedLocale } from '@/i18n/locale'
import manifest from '@/lib/marketing-i18n-manifest.json'

const VI_CHAR_RE = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i

function getPairs(): [string, string][] {
  return Object.entries(manifest.pairs).filter(
    (entry): entry is [string, string] => Boolean(entry[0] && entry[1]),
  )
}

function preserveCase(match: string, replacement: string): string {
  if (match === match.toUpperCase() && /[A-ZÀ-Ỹ]/.test(match)) {
    return replacement.toUpperCase()
  }
  if (match[0] === match[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1)
  }
  return replacement
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function translateString(text: string, pairs: [string, string][]): string {
  let out = text
  const sorted = [...pairs].sort((a, b) => b[0].length - a[0].length)
  for (const [from, to] of sorted) {
    if (!from) continue
    if (from.includes('\n') || from.includes('<') || from.includes('&')) {
      if (out.includes(from)) out = out.split(from).join(to)
      continue
    }
    const re = new RegExp(escapeRegExp(from), 'gi')
    out = out.replace(re, (match) => preserveCase(match, to))
  }
  return out
}

function applyReplacements(html: string, pairs: [string, string][]): string {
  let out = html

  // Text nodes between tags
  out = out.replace(/>([^<]+)</g, (full, text: string) => {
    if (!text.trim() || text.includes('application/ld+json')) return full
    const translated = translateString(text, pairs)
    return `>${translated}<`
  })

  // Common translatable attributes
  out = out.replace(
    /\b(placeholder|aria-label|title|alt|value|data-wait)=(["'])([^"']*)\2/gi,
    (full, attr: string, quote: string, value: string) => {
      const translated = translateString(value, pairs)
      if (translated === value) return full
      return `${attr}=${quote}${translated}${quote}`
    },
  )

  return out
}

export function applyMarketingI18n(html: string, locale: SupportedLocale): string {
  if (locale !== 'en') return html
  return applyReplacements(html, getPairs())
}

/** Detect leftover Vietnamese in rendered English HTML (for tests). */
export function findUntranslatedVietnamese(html: string): string[] {
  const found = new Set<string>()
  for (const match of html.matchAll(/>([^<]{2,300})</g)) {
    const text = match[1].replace(/&nbsp;/g, ' ').trim()
    if (!text || !VI_CHAR_RE.test(text)) continue
    if (text.includes('application/ld+json')) continue
    found.add(text)
  }
  return [...found].sort()
}

export function getManifestPairCount(): number {
  return getPairs().length
}
