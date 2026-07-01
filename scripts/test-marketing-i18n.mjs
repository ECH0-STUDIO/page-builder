#!/usr/bin/env node
/**
 * Validate EN marketing pages have no untranslated Vietnamese in text nodes.
 * Simulates: load HTML → apply i18n → report leftovers.
 * Run: pnpm test:marketing-i18n
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const marketingDir = path.join(root, 'apps/web/public/marketing')

const VI_CHAR_RE = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i

// Dynamic import TS — use tsx if available, else inline minimal check via manifest JSON
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'apps/web/src/lib/marketing-i18n-manifest.json'), 'utf8'),
)

function getPairs() {
  return Object.entries(manifest.pairs).filter(([, en]) => en)
}

const MIN_SUBSTRING_KEY_LENGTH = 10

function shouldSubstringReplace(key, haystack) {
  if (key.length >= MIN_SUBSTRING_KEY_LENGTH) return true
  if (key.includes('\n') || key.includes('<') || key.includes('&')) return true
  return haystack.trim() === key.trim()
}

function translateString(text, pairs) {
  let out = text
  const sorted = [...pairs].sort((a, b) => b[0].length - a[0].length)
  for (const [from, to] of sorted) {
    if (!from || !to) continue
    if (from.includes('\n') || from.includes('<')) {
      out = out.split(from).join(to)
      continue
    }
    if (!shouldSubstringReplace(from, out)) continue
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    out = out.replace(new RegExp(escaped, 'gi'), to)
  }
  return out
}

function applyI18n(html, pairs) {
  let out = html.replace(/>([^<]+)</g, (full, text) => {
    const t = translateString(text, pairs)
    return `>${t}<`
  })
  out = out.replace(
    /\b(placeholder|aria-label|title|alt|value)=(["'])([^"']*)\2/gi,
    (full, attr, quote, value) => {
      const t = translateString(value, pairs)
      return t === value ? full : `${attr}=${quote}${t}${quote}`
    },
  )
  return out
}

function findVi(html) {
  const found = []
  for (const m of html.matchAll(/>([^<]{2,300})</g)) {
    const t = m[1].trim()
    if (VI_CHAR_RE.test(t)) found.push(t)
  }
  return found
}

const pairs = getPairs()
const pages = fs
  .readdirSync(marketingDir)
  .filter((f) => f.endsWith('.html') && !f.startsWith('40'))

let failed = false
for (const file of pages) {
  const raw = fs.readFileSync(path.join(marketingDir, file), 'utf8')
  const en = applyI18n(raw, pairs)
  const leftover = findVi(en)
  if (leftover.length) {
    console.error(`FAIL ${file}: ${leftover.length} untranslated string(s):`)
    leftover.slice(0, 15).forEach((s) => console.error(`  - ${JSON.stringify(s)}`))
    failed = true
  } else {
    console.log(`OK   ${file}: fully translated (${pairs.length} pairs applied)`)
  }
}

const nullCount = Object.values(manifest.pairs).filter((v) => !v).length
if (nullCount) {
  console.error(
    `\nFAIL: ${nullCount} manifest entry(ies) still have null English text.`,
  )
  console.error('Run: pnpm seed:marketing-i18n')
  console.error('Or pull latest and re-run: pnpm sync:marketing')
  failed = true
}

process.exit(failed ? 1 : 0)
