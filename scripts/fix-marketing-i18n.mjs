#!/usr/bin/env node
/**
 * One-shot repair for marketing i18n manifest (null entries + stale corruption).
 * Run: pnpm fix:marketing-i18n
 */
import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'
import {
  buildTranslationIndex,
  fillNullTranslations,
  normalizeKey,
  resolveTranslation,
} from './marketing-i18n-normalize.mjs'
import { applyMarketingI18nToHtml } from './marketing-i18n-translate.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const manifestPath = path.join(root, 'apps/web/src/lib/marketing-i18n-manifest.json')
const marketingDir = path.join(root, 'apps/web/public/marketing')

const VI_CHAR_RE = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i

console.log('Marketing i18n repair (v2 — exact-only guard for short keys)\n')

const seed = spawnSync('node', ['scripts/seed-marketing-i18n-manifest.mjs'], {
  cwd: root,
  stdio: 'inherit',
})
if (seed.status !== 0) process.exit(seed.status ?? 1)

let manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const beforeNulls = Object.values(manifest.pairs).filter((v) => !v).length

// Drop null placeholders that duplicate a known normalized translation
const index = buildTranslationIndex(manifest.pairs)
const cleaned = {}
let droppedNulls = 0
for (const [vi, en] of Object.entries(manifest.pairs)) {
  if (!en) {
    const resolved = index.get(normalizeKey(vi))
    if (resolved) {
      cleaned[vi] = resolved
      continue
    }
    droppedNulls++
    continue
  }
  cleaned[vi] = en
}
manifest.pairs = cleaned

const filled = fillNullTranslations(manifest.pairs)
manifest.version = 2
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

const afterNulls = Object.values(manifest.pairs).filter((v) => !v).length
const pairs = Object.entries(manifest.pairs).filter(([, en]) => en)

console.log(`\nManifest: ${pairs.length} translated pairs`)
if (beforeNulls) console.log(`  Resolved ${beforeNulls - afterNulls} null entry(ies)`)
if (filled) console.log(`  Filled ${filled} via normalized match`)
if (droppedNulls) console.log(`  Dropped ${droppedNulls} unresolved null placeholder(s)`)
if (afterNulls) {
  console.error(`\nStill missing English for ${afterNulls} string(s):`)
  Object.entries(manifest.pairs)
    .filter(([, en]) => !en)
    .slice(0, 10)
    .forEach(([vi]) => console.error(`  - ${JSON.stringify(vi)}`))
  process.exit(1)
}

if (!fs.existsSync(marketingDir)) {
  console.log('\nNo marketing HTML yet — run pnpm sync:marketing after import.')
  process.exit(0)
}

let failures = 0
for (const file of fs.readdirSync(marketingDir).filter((f) => f.endsWith('.html') && !f.startsWith('40'))) {
  const raw = fs.readFileSync(path.join(marketingDir, file), 'utf8')
  const en = applyMarketingI18nToHtml(raw, pairs)
  const leftover = []
  for (const m of en.matchAll(/>([^<]{2,300})</g)) {
    const t = m[1].trim()
    if (VI_CHAR_RE.test(t)) leftover.push(t)
  }
  if (leftover.length) {
    console.error(`FAIL ${file}: ${leftover.length} untranslated fragment(s)`)
    leftover.slice(0, 5).forEach((s) => console.error(`  - ${JSON.stringify(s)}`))
    failures++
  } else {
    console.log(`OK   ${file}`)
  }
}

process.exit(failures ? 1 : 0)
