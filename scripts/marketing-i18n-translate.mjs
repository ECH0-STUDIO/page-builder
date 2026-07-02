/**
 * Canonical marketing HTML string translation (used by tests + fix script).
 * Keep in sync with apps/web/src/lib/marketing-i18n.ts
 */

import { decodeEntities, encodeHtmlTextEntities } from './marketing-i18n-normalize.mjs'

/** Never replace these as substrings inside longer Vietnamese phrases. */
export const EXACT_ONLY_KEYS = new Set([
  'Chi phí',
  'CHI PHÍ',
  'Tính năng',
  'TÍNH NĂNG',
  'Bắt đầu',
  'tháng',
  '/ tháng',
  'Lưu',
  'Khám phá',
  'Miễn phí',
  'Lượt xem',
  'Khách hàng',
  'Nổi bật',
  'credit',
  'Credit',
  'credits',
  'Tin tức',
  'TIN TỨC',
  'Liên hệ',
  'LIÊN HỆ',
  'Bước 1',
  'Bước 2',
  'Bước 3',
  'Mới',
  'Phổ biến',
  'Email',
  'Hủy',
  'Xóa',
  'Bởi',
  'Đọc thêm',
])

const MIN_SUBSTRING_KEY_LENGTH = 12

export function shouldSubstringReplace(key, haystack) {
  if (EXACT_ONLY_KEYS.has(key)) return haystack.trim() === key.trim()
  if (key.length >= MIN_SUBSTRING_KEY_LENGTH) return true
  if (key.includes('\n') || key.includes('<') || key.includes('&')) return true
  return haystack.trim() === key.trim()
}

function preserveCase(match, replacement) {
  if (match === match.toUpperCase() && /[A-ZÀ-Ỹ]/.test(match)) {
    return replacement.toUpperCase()
  }
  if (match[0] === match[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1)
  }
  return replacement
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function translateString(text, pairs) {
  let out = decodeEntities(text)
  const sorted = [...pairs].sort((a, b) => b[0].length - a[0].length)
  for (const [from, to] of sorted) {
    if (!from || !to) continue
    if (from.includes('\n') || from.includes('<') || from.includes('&')) {
      if (out.includes(from)) out = out.split(from).join(to)
      continue
    }
    if (!shouldSubstringReplace(from, out)) continue
    const re = new RegExp(escapeRegExp(from), 'gi')
    out = out.replace(re, (match) => preserveCase(match, to))
  }
  return encodeHtmlTextEntities(out)
}

export function applyMarketingI18nToHtml(html, pairs) {
  let out = html.replace(/>([^<]+)</g, (full, text) => {
    const t = translateString(text, pairs)
    return `>${t}<`
  })
  out = out.replace(
    /\b(placeholder|aria-label|title|alt|value|data-wait)=(["'])([^"']*)\2/gi,
    (full, attr, quote, value) => {
      const t = translateString(value, pairs)
      return t === value ? full : `${attr}=${quote}${t}${quote}`
    },
  )
  return out
}
