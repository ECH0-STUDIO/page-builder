#!/usr/bin/env node
/**
 * Import the Eatery Webflow export into design/webflow-export/ and sync to public/marketing.
 *
 * Usage:
 *   pnpm import:eatery-export
 *   pnpm import:eatery-export "/Users/mac/Downloads/Eatery Marketing Website"
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const target = path.join(root, 'design/webflow-export')

const defaultSources = [
  '/Users/mac/Downloads/Eatery Marketing Website',
  path.join(process.env.HOME || '', 'Downloads/Eatery Marketing Website'),
]

function resolveSource(arg) {
  if (arg) {
    const resolved = path.resolve(arg)
    if (!fs.existsSync(resolved)) {
      console.error(`Source not found: ${resolved}`)
      process.exit(1)
    }
    return resolved
  }
  for (const candidate of defaultSources) {
    if (candidate && fs.existsSync(candidate)) return candidate
  }
  console.error(
    'Eatery Webflow export not found. Pass the path to your export folder:\n' +
      '  pnpm import:eatery-export "/Users/mac/Downloads/Eatery Marketing Website"',
  )
  process.exit(1)
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true })
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry))
    }
    return
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
}

function validateExport(dir) {
  const indexPath = path.join(dir, 'index.html')
  if (!fs.existsSync(indexPath)) {
    console.error('Invalid export: missing index.html')
    process.exit(1)
  }
  const index = fs.readFileSync(indexPath, 'utf8')
  const isEatery = /Eatery|eateryvn|Dành cho các cửa hàng/i.test(index)
  if (!isEatery && /Nexbet|Temlis|nexbit-temlis/i.test(index)) {
    console.warn(
      'WARNING: index.html still looks like the old Nexbet template. ' +
        'Make sure you exported the Eatery Marketing Website project from Webflow.',
    )
  }
  const expected = ['blog.html', 'detail_blog.html', 'features.html', 'pricing.html', 'contact.html']
  const missing = expected.filter((f) => !fs.existsSync(path.join(dir, f)))
  if (missing.length) {
    console.warn(`Export missing pages (routes will fall back to homepage anchors): ${missing.join(', ')}`)
  }
}

const source = resolveSource(process.argv[2])
console.log(`Importing Webflow export from:\n  ${source}\n→ ${target}`)

if (fs.existsSync(target)) {
  fs.rmSync(target, { recursive: true, force: true })
}
fs.mkdirSync(target, { recursive: true })
copyRecursive(source, target)
validateExport(target)

const sync = spawnSync('pnpm', ['sync:marketing'], { cwd: root, stdio: 'inherit', shell: true })
if (sync.status !== 0) process.exit(sync.status ?? 1)
console.log('Done. Restart dev server: rm -rf apps/web/.next && pnpm dev')
