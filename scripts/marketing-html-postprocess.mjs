/**
 * Post-process Webflow HTML after sync — fixes asset paths, nav links, hero image, empty CMS block.
 * Keep in sync with apps/web/src/lib/marketing-webflow.ts rewriteMarketingHtml().
 */

import fs from 'fs'
import path from 'path'

const RESERVED = new Set(['template', '401', '404'])

function encodeMarketingImagePath(imagePath) {
  const clean = imagePath.replace(/^\.?\/?images\//, '')
  return `/marketing/images/${clean.split('/').map(encodeURIComponent).join('/')}`
}

function rewriteSrcset(value) {
  return value
    .split(',')
    .map((part) => {
      const trimmed = part.trim()
      const match = trimmed.match(/^(.+)\s+(\d+w)$/)
      const url = match ? match[1] : trimmed
      const descriptor = match ? match[2] : ''
      if (url.startsWith('images/') || url.startsWith('./images/')) {
        const next = encodeMarketingImagePath(url)
        return descriptor ? `${next} ${descriptor}` : next
      }
      return part
    })
    .join(', ')
}

function listPageSlugs(marketingDir) {
  return fs
    .readdirSync(marketingDir)
    .filter((name) => name.endsWith('.html') && name !== 'index.html')
    .map((name) => name.replace(/\.html$/i, ''))
    .filter((slug) => !RESERVED.has(slug))
}

export function rewriteMarketingHtml(html, pageSlugs) {
  const slugs = new Set(pageSlugs)
  let out = html.replace(/Frame-2147227617_1Frame-2147227617/g, 'Frame-2147227617_1Frame 2147227617')

  out = out.replace(/((?:href|src)=["'])(?:\.\/)?css\//g, '$1/marketing/css/')
  out = out.replace(/((?:href|src)=["'])(?:\.\/)?js\//g, '$1/marketing/js/')
  out = out.replace(
    /((?:href|src)=["'])(?:\.\/)?images\/([^"']+)["']/g,
    (_m, prefix, imgPath) => `${prefix}${encodeMarketingImagePath(imgPath)}"`,
  )
  out = out.replace(/srcset=["']([^"']+)["']/gi, (_m, value) => `srcset="${rewriteSrcset(value)}"`)

  out = out.replace(/href=["']index\.html(?:#[^"']*)?["']/gi, 'href="/"')
  out = out.replace(/href=["']([^"'#?/][^"']*)\.html(#[^"']*)?["']/gi, (_m, page, hash = '') => {
    const slug = page.replace(/^\.\//, '').toLowerCase()
    if (slug === 'index') return `href="/${hash}"`
    return `href="/${slug}${hash}"`
  })

  out = out.replace(
    /href=["']https?:\/\/[^/"']+\.webflow\.io\/#([a-z0-9-]+)["']/gi,
    (_m, section) => (slugs.has(section) ? `href="/${section}"` : `href="/#${section}"`),
  )
  out = out.replace(
    /href=["']https?:\/\/[^/"']+\.webflow\.io\/([a-z0-9-]+)["']/gi,
    (_m, section) => `href="/${section}"`,
  )
  out = out.replace(/href=["']https?:\/\/[^/"']+\/(#[^"']+)["']/gi, 'href="/$1"')

  out = out.replace(/<div class="w-dyn-empty">\s*<div>No items found\.<\/div>\s*<\/div>/gi, '')
  out = out.replace(/<div class="temlis_component">[\s\S]*?<\/div>\s*<\/div>\s*(?=<\/div>\s*<script)/i, '')

  out = out.replace(/\/marketing\/images\/favicon\.png/g, '/logo-icon.png')
  out = out.replace(/\/marketing\/images\/webclip\.png/g, '/logo-icon.png')

  return out
}

export function postprocessMarketingHtmlFiles(marketingDir) {
  const pageSlugs = listPageSlugs(marketingDir)
  let count = 0

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
        continue
      }
      if (!entry.name.endsWith('.html')) continue
      const raw = fs.readFileSync(full, 'utf8')
      fs.writeFileSync(full, rewriteMarketingHtml(raw, pageSlugs))
      count++
    }
  }

  walk(marketingDir)
  return count
}
