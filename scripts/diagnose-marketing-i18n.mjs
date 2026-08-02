#!/usr/bin/env node
/** Print marketing i18n setup status. Run: pnpm diagnose:marketing-i18n */
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = path.join(root, 'apps/web/src/lib/marketing-i18n-manifest.json')

let commit = 'unknown'
try {
  commit = execSync('git rev-parse --short HEAD', { cwd: root, encoding: 'utf8' }).trim()
} catch {
  /* not a git checkout */
}

const i18nTs = fs.readFileSync(path.join(root, 'apps/web/src/lib/marketing-i18n.ts'), 'utf8')
const seedJs = fs.readFileSync(path.join(root, 'scripts/seed-marketing-i18n-manifest.mjs'), 'utf8')
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
const nulls = Object.values(manifest.pairs).filter((v) => !v).length

console.log('Marketing i18n diagnostics\n')
console.log(`  Git commit:        ${commit}`)
console.log(`  Manifest version:  ${manifest.version ?? 1}`)
console.log(`  Translated pairs:  ${Object.values(manifest.pairs).filter(Boolean).length}`)
console.log(`  Null entries:      ${nulls}`)
console.log(
  `  EXACT_ONLY guard:  ${i18nTs.includes('EXACT_ONLY_KEYS') ? 'yes' : 'NO — pull latest'}`,
)
console.log(
  `  Eatery seed block: ${seedJs.includes('Eatery Marketing Website export') ? 'yes' : 'NO — pull latest'}`,
)
console.log(
  `  fix script v2:     ${fs.existsSync(path.join(root, 'scripts/fix-marketing-i18n.mjs')) ? 'yes' : 'NO — pull latest'}`,
)

if (nulls || !i18nTs.includes('EXACT_ONLY_KEYS')) {
  console.log('\n→ Run: git pull origin cursor/replace-marketing-webflow-ffbe')
  console.log('→ Then: pnpm fix:marketing-i18n')
  process.exit(1)
}

console.log('\nSetup looks good. Run: pnpm test:marketing-i18n')
