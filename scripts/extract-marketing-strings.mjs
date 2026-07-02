#!/usr/bin/env node
/**
 * Extract user-visible Vietnamese strings from synced marketing HTML.
 * Does NOT modify marketing-i18n-manifest.json (avoids git conflicts).
 * Run: node scripts/extract-marketing-strings.mjs [dir]
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { decodeEntities, resolveTranslation } from './marketing-i18n-normalize.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const targetDir = path.resolve(root, process.argv[2] || 'apps/web/public/marketing')
const extractPath = path.join(root, 'design/webflow-export/.marketing-strings-extract.json')
const manifestPath = path.join(root, 'apps/web/src/lib/marketing-i18n-manifest.json')

const VI_CHAR_RE = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i
const SKIP_RE =
  /^(https?:|\/marketing\/|\/logo|w-mod|function |var |@|\.|\d+$|#[0-9a-f]{3,8}$|\{|\}|M[\d.LCZ])/i

function normalize(text) {
  return decodeEntities(text).replace(/\s+/g, ' ').trim()
}

function isTranslatable(text) {
  if (!text || text.length < 2) return false
  if (SKIP_RE.test(text)) return false
  if (/^[\d\s.,:;|•·\-–—%$€£₫+()/\\[\]{}]+$/.test(text)) return false
  if (text.length > 500) return false
  if (VI_CHAR_RE.test(text)) return true
  const lower = text.toLowerCase()
  const viPhrases = [
    'cua hang', 'quán', 'thuc don', 'thực đơn', 'bat dau', 'bắt đầu', 'mien phi', 'miễn phí',
    'tinh nang', 'bang gia', 'lien he', 'tin tuc', 'chi phi', 'tai khoan', 'tai sao',
    'cach hoat', 'buoc', 'tên miền', 'ten mien', 'don hang', 'đơn hàng', 'xuat ban',
  ]
  return viPhrases.some((h) => lower.includes(h))
}

function walkHtmlFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walkHtmlFiles(full, files)
    else if (entry.name.endsWith('.html')) files.push(full)
  }
  return files
}

function extractFromHtml(html) {
  const found = new Set()
  for (const m of html.matchAll(/>([^<]{1,500})</g)) {
    const t = normalize(m[1])
    if (isTranslatable(t)) found.add(t)
  }
  for (const m of html.matchAll(
    /\b(?:placeholder|aria-label|title|alt|value|data-wait)=(["'])([^"']{1,300})\1/gi,
  )) {
    const t = normalize(m[2])
    if (isTranslatable(t)) found.add(t)
  }
  for (const m of html.matchAll(/class="button_text[^"]*"[^>]*>([^<]{1,120})</gi)) {
    const t = normalize(m[1])
    if (isTranslatable(t)) found.add(t)
  }
  return found
}

const byFile = {}
const all = new Set()

for (const file of walkHtmlFiles(targetDir)) {
  const rel = path.relative(root, file)
  const html = fs.readFileSync(file, 'utf8')
  const strings = [...extractFromHtml(html)].sort()
  byFile[rel] = strings
  strings.forEach((s) => all.add(s))
}

const manifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  : { version: 2, pairs: {} }

const missing = []
for (const vi of [...all].sort((a, b) => b.length - a.length)) {
  if (manifest.pairs[vi] || resolveTranslation(vi, manifest.pairs)) continue
  missing.push(vi)
}

fs.mkdirSync(path.dirname(extractPath), { recursive: true })
fs.writeFileSync(
  extractPath,
  JSON.stringify(
    {
      extractedAt: new Date().toISOString(),
      byFile,
      all: [...all],
      missing,
    },
    null,
    2,
  ),
)

if (missing.length) {
  console.log(`\n${missing.length} string(s) need English translation (see fix:marketing-i18n):\n`)
  missing.slice(0, 20).forEach((s) => console.log(`  - ${JSON.stringify(s)}`))
  if (missing.length > 20) console.log(`  … and ${missing.length - 20} more`)
} else {
  console.log(`All ${all.size} extracted string(s) have translations in manifest.`)
}

console.log(`\nWrote ${extractPath}`)
console.log('Manifest unchanged — run pnpm fix:marketing-i18n to apply translations.')
