#!/usr/bin/env node
/**
 * Contract tests for shared marketing chrome (nav + footer contact).
 * Keep `NAV` in sync with `apps/web/src/lib/marketing-nav.ts`.
 * Run: pnpm test:marketing-chrome
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const NAV = [
  { href: '/explore', labels: { vi: 'Khám phá', en: 'Explore' } },
  { href: '/pricing', labels: { vi: 'Chi phí', en: 'Pricing' } },
  { href: '/features', labels: { vi: 'Tính năng', en: 'Features' } },
  { href: '/blog', labels: { vi: 'Tin tức', en: 'Blog' } },
]

function marketingPathForLocale(pathname, locale) {
  if (locale === 'en') return `${pathname}?lang=en`
  return pathname
}

function isActive(pathname, href) {
  const pathOnly = (pathname.split('?')[0] || '/').replace(/\/$/, '') || '/'
  if (href === '/') return pathOnly === '/'
  return pathOnly === href || pathOnly.startsWith(`${href}/`)
}

function extractNavLinkClass(listHtml) {
  const match = listHtml.match(/class="([^"]*\bnav_links\b[^"]*)"/i)
  if (!match) return 'nav_links w-nav-link'
  const classes = match[1].split(/\s+/).filter((cls) => cls && cls !== 'w--current')
  return classes.length > 0 ? classes.join(' ') : 'nav_links w-nav-link'
}

function rewriteNavbarList(html, pathname, locale) {
  return html.replace(/<div class="navbar_list">[\s\S]*?<\/div>/gi, (full) => {
    const inner = full.replace(/^<div class="navbar_list">/i, '').replace(/<\/div>$/i, '')
    const className = extractNavLinkClass(inner)
    const items = NAV.map((item) => {
      const active = isActive(pathname, item.href)
      const href = marketingPathForLocale(item.href, locale)
      const currentAttr = active ? ' aria-current="page"' : ''
      const cls = active ? `${className} w--current` : className
      return `<a href="${href}" navbar="item"${currentAttr} class="${cls}">${item.labels[locale]}</a>`
    }).join('\n                  ')
    return `<div class="navbar_list">\n                  ${items}\n                </div>`
  })
}

function parseNav(html) {
  const list = html.match(/<div class="navbar_list">([\s\S]*?)<\/div>/i)?.[1] ?? ''
  return [...list.matchAll(/<a\s+([^>]+)>([^<]*)<\/a>/gi)].map((m) => {
    const attrs = m[1]
    const href = attrs.match(/href="([^"]*)"/)?.[1] ?? ''
    const className = attrs.match(/class="([^"]*)"/)?.[1] ?? ''
    return {
      href,
      label: m[2].trim(),
      current: /aria-current="page"/.test(attrs) || /\bw--current\b/.test(className),
      className,
    }
  })
}

function sourceContainsCanonicalNav() {
  const src = fs.readFileSync(path.join(root, 'apps/web/src/lib/marketing-nav.ts'), 'utf8')
  const chrome = fs.readFileSync(path.join(root, 'apps/web/src/lib/marketing-chrome.ts'), 'utf8')
  const hrefs = NAV.map((item) => item.href)
  for (const href of hrefs) {
    if (!src.includes(`href: '${href}'`)) {
      throw new Error(`marketing-nav.ts missing ${href}`)
    }
  }
  if (!chrome.includes('rewriteMarketingChromeShared')) {
    throw new Error('injectMarketingChrome is not using rewriteMarketingChromeShared')
  }
  if (chrome.includes('Soft-add Explore')) {
    throw new Error('legacy Explore soft-add is still in marketing-chrome.ts')
  }
}

let failed = false
function check(name, ok, detail = '') {
  if (ok) {
    console.log(`OK   ${name}`)
    return
  }
  failed = true
  console.error(`FAIL ${name}${detail ? `: ${detail}` : ''}`)
}

sourceContainsCanonicalNav()
check('canonical nav source of truth is wired', true)

const marketingDir = path.join(root, 'apps/web/public/marketing')
const indexHtml = fs.readFileSync(path.join(marketingDir, 'index.html'), 'utf8')
const pricingHtml = fs.readFileSync(path.join(marketingDir, 'pricing.html'), 'utf8')
const detailHtml = fs.readFileSync(path.join(marketingDir, 'detail_blog.html'), 'utf8')

const home = rewriteNavbarList(indexHtml, '/', 'vi')
const homeNav = parseNav(home)
check(
  'homepage nav has 4 canonical links',
  homeNav.length === 4 && homeNav.map((l) => l.href).join() === '/explore,/pricing,/features,/blog',
  homeNav.map((l) => l.href).join(', '),
)
check('homepage Explore is not current', homeNav[0]?.label === 'Khám phá' && !homeNav[0]?.current)
check('homepage keeps base (non-variant) nav classes', homeNav.every((l) => l.className === 'nav_links w-nav-link'))

const pricing = rewriteNavbarList(pricingHtml, '/pricing', 'en')
const pricingNav = parseNav(pricing)
check(
  'pricing nav uses secondary variant classes',
  pricingNav.every((l) => l.className.includes('w-variant-ee55ce32-a978-c618-3574-db62d5d3cef2')),
)
check(
  'pricing is current only on /pricing',
  pricingNav.filter((l) => l.current).map((l) => l.href).join() === '/pricing?lang=en',
)
check('EN pricing labels', pricingNav.map((l) => l.label).join() === 'Explore,Pricing,Features,Blog')

const exploreFromPricing = rewriteNavbarList(
  `${pricingHtml}<div class="marketing-locale-switcher"><a href="/explore">VI</a></div>`,
  '/explore',
  'vi',
)
const exploreNav = parseNav(exploreFromPricing)
check(
  'explore page still gets Explore in nav even if locale switcher already links to /explore',
  exploreNav.length === 4 && exploreNav[0]?.href === '/explore' && exploreNav[0]?.current,
)
check(
  'explore page does not keep pricing current from the template',
  !exploreNav.some((l) => l.href.includes('/pricing') && l.current),
)

const article = rewriteNavbarList(detailHtml, '/blog/how-to-start', 'vi')
const articleNav = parseNav(article)
check(
  'blog article marks Blog as current',
  articleNav.filter((l) => l.current).map((l) => l.href).join() === '/blog',
)

process.exit(failed ? 1 : 0)
