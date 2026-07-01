import type { SupportedLocale } from '@/i18n/locale'
import { MARKETING_VI_TO_EN } from '@/lib/marketing-i18n-data'

const VI_CHAR_RE = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i

function preserveCase(match: string, replacement: string): string {
  if (match === match.toUpperCase() && /[A-Z]/.test(match)) {
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

function applyReplacements(html: string, pairs: [string, string][]): string {
  let out = html
  const sorted = [...pairs].sort((a, b) => b[0].length - a[0].length)

  for (const [from, to] of sorted) {
    if (!from) continue
    if (from.includes('\n') || from.includes('<') || from.includes('&')) {
      out = out.split(from).join(to)
      continue
    }
    const re = new RegExp(escapeRegExp(from), 'gi')
    out = out.replace(re, (match) => preserveCase(match, to))
  }
  return out
}

export function applyMarketingI18n(html: string, locale: SupportedLocale): string {
  if (locale !== 'en') return html
  return applyReplacements(html, MARKETING_VI_TO_EN)
}

/** Detect leftover Vietnamese in rendered English HTML (for tests). */
export function findUntranslatedVietnamese(html: string): string[] {
  const found = new Set<string>()
  for (const match of html.matchAll(/>([^<]{2,200})</g)) {
    const text = match[1].replace(/&nbsp;/g, ' ').trim()
    if (!text || !VI_CHAR_RE.test(text)) continue
    if (text.includes('application/ld+json')) continue
    found.add(text)
  }
  return [...found].sort()
}
