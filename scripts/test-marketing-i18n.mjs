#!/usr/bin/env node
/**
 * Validate EN marketing pages have no untranslated Vietnamese in text nodes.
 * Simulates: load HTML → apply i18n → report leftovers.
 * Run: pnpm test:marketing-i18n
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { applyMarketingI18nToHtml } from './marketing-i18n-translate.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const marketingDir = path.join(root, 'apps/web/public/marketing')

const VI_CHAR_RE = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i

const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'apps/web/src/lib/marketing-i18n-manifest.json'), 'utf8'),
)

function getPairs() {
  return Object.entries(manifest.pairs).filter(([, en]) => en)
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
  const en = applyMarketingI18nToHtml(raw, pairs)
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
  console.error(`\nFAIL: ${nullCount} manifest entry(ies) still have null English text.`)
  console.error('Run: pnpm fix:marketing-i18n')
  failed = true
}

if ((manifest.version ?? 1) < 2) {
  console.error('\nFAIL: manifest is outdated (version < 2).')
  console.error('Run: pnpm fix:marketing-i18n')
  failed = true
}

process.exit(failed ? 1 : 0)
