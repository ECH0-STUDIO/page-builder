#!/usr/bin/env node
/**
 * Copy Webflow export → apps/web/public/marketing, then post-process HTML.
 *
 * Place your export in design/webflow-export/ (replace folder contents),
 * then run: pnpm sync:marketing
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ensureBlogHtml } from './generate-blog-fallback.mjs'
import { postprocessMarketingHtmlFiles } from './marketing-html-postprocess.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const source = path.join(root, 'design/webflow-export')
const target = path.join(root, 'apps/web/public/marketing')

function copyRecursive(src, dest) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true })
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry))
    }
    return
  }
  if (path.basename(src).toLowerCase() === 'readme.md') return
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
}

if (!fs.existsSync(source)) {
  console.error(`Missing Webflow export at ${source}`)
  process.exit(1)
}

const EXPECTED_PAGES = ['blog', 'features', 'pricing', 'contact']
const missingPages = EXPECTED_PAGES.filter(
  (slug) => !fs.existsSync(path.join(source, `${slug}.html`)),
)
if (missingPages.length > 0) {
  console.warn(
    `Webflow export is missing: ${missingPages.map((s) => `${s}.html`).join(', ')}`,
  )
  if (missingPages.includes('blog')) {
    ensureBlogHtml(source)
  }
  if (missingPages.some((s) => s !== 'blog')) {
    console.warn(
      'Copy the full export folder (e.g. "Eatery Marketing Website" from Webflow) into design/webflow-export/, then re-run pnpm sync:marketing',
    )
  }
}

if (fs.existsSync(target)) {
  fs.rmSync(target, { recursive: true, force: true })
}

copyRecursive(source, target)
const htmlCount = postprocessMarketingHtmlFiles(target)
console.log(`Synced ${source} → ${target}`)
console.log(`Post-processed ${htmlCount} HTML file(s)`)
