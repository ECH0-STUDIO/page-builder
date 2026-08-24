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
  if (!chrome.includes('rewriteMarketingCtaLinks')) {
    throw new Error('injectMarketingChrome is not rewriting Get started links')
  }
  if (!src.includes("MARKETING_CTA_PATH = '/'")) {
    throw new Error('marketing-nav.ts missing MARKETING_CTA_PATH')
  }
  if (!src.includes("MARKETING_CONTACT_EMAIL = 'hello@ech0.work'")) {
    throw new Error('marketing-nav.ts missing contact email')
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

function rewriteCtaLinks(html, ctaHref) {
  return html.replace(/href="https?:\/\/app\.eateryvn\.com\/?"/gi, `href="${ctaHref}"`)
}

function rewriteFooter(html, locale = 'vi') {
  const email = 'hello@ech0.work'
  const address = locale === 'en' ? 'Da Nang, Vietnam' : 'Đà Nẵng, Việt Nam'
  const tagline =
    locale === 'en'
      ? 'Tools and solutions for small and medium stores.'
      : 'Tổng hợp công cụ và giải pháp cho các cửa hàng vừa và nhỏ.'
  const mapUrl = 'https://maps.app.goo.gl/UqHpW4ENjPrm4eAb7'
  let out = html
    .replace(/mailto:Nextbit@company\.com/gi, `mailto:${email}`)
    .replace(/Nextbit@company\.com/gi, email)
  out = out.replace(
    /<a href="mailto:[^"]*" class="footer_link w-inline-block">\s*<div>[^<]*<\/div>\s*<\/a>/i,
    `<a href="mailto:${email}" class="footer_link w-inline-block"><div>${email}</div></a>`,
  )
  out = out.replace(
    /<a href="https:\/\/maps\.app\.goo\.gl\/[^"]*" class="footer_link w-inline-block">\s*<div>[^<]*<\/div>\s*<\/a>/i,
    `<a href="${mapUrl}" class="footer_link w-inline-block"><div>${address}</div></a>`,
  )
  out = out.replace(
    /(<div class="footer_header">[\s\S]*?<div class="text-color-on-primary">)[\s\S]*?(<\/div>)/i,
    `$1${tagline}$2`,
  )
  out = out.replace(/href="https?:\/\/(?:www\.)?(?:facebook|fb)\.com\/?[^"]*"/gi, 'href="https://fb.com"')
  out = out.replace(/href="https?:\/\/(?:www\.)?instagram\.com\/?[^"]*"/gi, 'href="https://instagram.com"')
  if (!/\sid="contact"/i.test(out)) {
    out = out.replace(/<div class="footer_contact">/i, '<div id="contact" class="footer_contact">')
  }
  return out
}

const ctaSample = rewriteCtaLinks(
  '<a href="https://app.eateryvn.com/">Bắt đầu ngay</a><a href="https://app.eateryvn.com/login">Login</a>',
  'https://app.example.test/',
)
check(
  'Get started root URL is rewritten, login URL is left for the auth rewrite',
  ctaSample.includes('href="https://app.example.test/"') && ctaSample.includes('https://app.eateryvn.com/login'),
)

const homeFooter = rewriteFooter(indexHtml, 'vi')
const pricingFooter = rewriteFooter(pricingHtml, 'vi')
check('homepage footer uses canonical email', homeFooter.includes('mailto:hello@ech0.work') && !homeFooter.includes('Nextbit@company.com'))
check('pricing footer uses the same email as homepage', pricingFooter.includes('mailto:hello@ech0.work') && !pricingFooter.includes('Nextbit@company.com'))
check('homepage footer has #contact', /id="contact"/.test(homeFooter))
check('pricing footer has #contact', /id="contact"/.test(pricingFooter))
check(
  'homepage and pricing share the same footer tagline',
  homeFooter.includes('Tổng hợp công cụ và giải pháp cho các cửa hàng vừa và nhỏ.') &&
    pricingFooter.includes('Tổng hợp công cụ và giải pháp cho các cửa hàng vừa và nhỏ.'),
)

const enFooter = rewriteFooter(pricingHtml, 'en')
check('english footer uses english address', enFooter.includes('Da Nang, Vietnam'))

const exploreExists = fs.existsSync(path.join(marketingDir, 'explore.html'))
check('explore.html shell exists', exploreExists)
if (exploreExists) {
  const exploreHtml = fs.readFileSync(path.join(marketingDir, 'explore.html'), 'utf8')
  check(
    'explore.html has stable explore shell (not pricing features body)',
    /data-eatery-explore-shell|id="explore-shell"/.test(exploreHtml) &&
      !/Eatery says no to monthly fees/i.test(exploreHtml),
  )
}

const seoSrc = fs.readFileSync(path.join(root, 'apps/web/src/lib/marketing-seo.ts'), 'utf8')
check('SEO writes canonical link', seoSrc.includes("upsertHeadLink(out, 'canonical'"))
check('SEO writes hreflang alternates', seoSrc.includes('hreflang="vi"') && seoSrc.includes('hreflang="en"'))
check('SEO strips Nexbet leftovers', seoSrc.includes('stripTemplateBrandLeftovers'))

const robotsSrc = fs.readFileSync(path.join(root, 'apps/web/src/app/robots.ts'), 'utf8')
check('robots.txt uses marketing sitemap URL', robotsSrc.includes('getMarketingBaseUrl'))

const sitemapSrc = fs.readFileSync(path.join(root, 'apps/web/src/app/sitemap.ts'), 'utf8')
check('sitemap does not list /contact redirect', !sitemapSrc.includes('/contact'))
check('sitemap uses public store URLs', sitemapSrc.includes('getPublicStoreUrl'))

const notFoundExists = fs.existsSync(path.join(root, 'apps/web/src/app/not-found.tsx'))
check('branded not-found page exists', notFoundExists)

process.exit(failed ? 1 : 0)
