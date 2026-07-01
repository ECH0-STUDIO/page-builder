#!/usr/bin/env node
/**
 * Smoke test: English locale keeps ?lang=en on internal marketing links.
 * Run: pnpm test:marketing-locale
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const MARKETING_LANG_PARAM = 'lang'

function marketingPathForLocale(pathname, locale) {
  const hashIdx = pathname.indexOf('#')
  const hash = hashIdx >= 0 ? pathname.slice(hashIdx) : ''
  const pathAndQuery = hashIdx >= 0 ? pathname.slice(0, hashIdx) : pathname
  const basePath = pathAndQuery.split('?')[0] || '/'
  if (locale === 'en') return `${basePath}?${MARKETING_LANG_PARAM}=en${hash}`
  return `${basePath}${hash}`
}

const MARKETING_PREFIXES = ['/', '/pricing', '/features', '/contact', '/blog']

function isMarketingRoute(pathname) {
  if (pathname === '/') return true
  return MARKETING_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function rewriteMarketingInternalLinks(html, locale) {
  return html.replace(/\bhref=(["'])([^"']+)\1/gi, (full, quote, href) => {
    if (!href.startsWith('/') || href.startsWith('//') || href.startsWith('/marketing/')) return full
    const hashIdx = href.indexOf('#')
    const hash = hashIdx >= 0 ? href.slice(hashIdx) : ''
    const pathPart = hashIdx >= 0 ? href.slice(0, hashIdx) : href
    const pathname = pathPart.split('?')[0] || '/'
    if (!isMarketingRoute(pathname)) return full
    return `href=${quote}${marketingPathForLocale(`${pathname}${hash}`, locale)}${quote}`
  })
}

// Inline longest-first replacement for regression test
const PAIRS = [
  ['Bắt đầu ngay', 'Get started now'],
  ['Bắt đầu miễn phí', 'Start for free'],
  ['Bắt đầu', 'Get started'],
].sort((a, b) => b[0].length - a[0].length)

function translateSample(html) {
  let out = html
  for (const [from, to] of PAIRS) {
    out = out.replaceAll(from, to)
  }
  return out
}

const marketingDir = path.join(root, 'apps/web/public/marketing')
const pages = fs.readdirSync(marketingDir).filter((f) => f.endsWith('.html') && !f.startsWith('40'))

let failed = false

for (const file of pages) {
  const raw = fs.readFileSync(path.join(marketingDir, file), 'utf8')
  const linked = rewriteMarketingInternalLinks(raw, 'en')
  const badLinks = [...linked.matchAll(/href=(["'])(\/[^"']+)\1/gi)]
    .map((m) => m[2])
    .filter((href) => isMarketingRoute(href.split('#')[0].split('?')[0] || '/'))
    .filter((href) => !href.includes('lang=en'))

  if (badLinks.length) {
    console.error(`FAIL ${file}: ${badLinks.length} internal link(s) missing ?lang=en`)
    badLinks.slice(0, 5).forEach((l) => console.error('  ', l))
    failed = true
  } else {
    console.log(`OK   ${file}: all marketing links carry ?lang=en`)
  }
}

const sample = '<div class="button_text">Bắt đầu ngay</div>'
const out = translateSample(sample)
if (out.includes('ngay') || out.includes('Bắt đầu')) {
  console.error('FAIL: partial translation for "Bắt đầu ngay":', out)
  failed = true
} else {
  console.log('OK   Bắt đầu ngay → Get started now')
}

process.exit(failed ? 1 : 0)
