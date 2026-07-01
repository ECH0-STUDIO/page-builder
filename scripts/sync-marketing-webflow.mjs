#!/usr/bin/env node
/**
 * Copy Webflow export → apps/web/public/marketing
 *
 * Place your export in design/webflow-export/ (replace folder contents),
 * then run: pnpm sync:marketing
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const source = path.join(root, 'design/webflow-export')
const target = path.join(root, 'apps/web/public/marketing')
const stylesTarget = path.join(root, 'apps/web/src/styles/marketing')

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

function copyCssToStyles() {
  const cssSource = path.join(source, 'css')
  if (!fs.existsSync(cssSource)) return
  fs.mkdirSync(stylesTarget, { recursive: true })
  for (const file of fs.readdirSync(cssSource)) {
    if (!file.endsWith('.css')) continue
    fs.copyFileSync(path.join(cssSource, file), path.join(stylesTarget, file))
  }
}

if (!fs.existsSync(source)) {
  console.error(`Missing Webflow export at ${source}`)
  process.exit(1)
}

if (fs.existsSync(target)) {
  fs.rmSync(target, { recursive: true, force: true })
}

copyRecursive(source, target)
copyCssToStyles()
console.log(`Synced ${source} → ${target}`)
console.log(`Synced CSS → ${stylesTarget}`)
