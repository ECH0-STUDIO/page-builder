import type { SupportedLocale } from '@/i18n/locale'
import { escapeHtml } from '@/lib/marketing-blog-html'
import { marketingPathForLocale } from '@/lib/marketing-locale'

/**
 * Canonical marketing chrome. Webflow HTML is a visual template only —
 * nav links, current-page state, and contact email are rewritten at serve time
 * so every page stays in sync.
 */
export const MARKETING_NAV_ITEMS = [
  { href: '/explore', labels: { vi: 'Khám phá', en: 'Explore' } },
  { href: '/pricing', labels: { vi: 'Chi phí', en: 'Pricing' } },
  { href: '/features', labels: { vi: 'Tính năng', en: 'Features' } },
  { href: '/blog', labels: { vi: 'Tin tức', en: 'Blog' } },
] as const

export const MARKETING_CONTACT_EMAIL = 'hello@ech0.work'
export const MARKETING_CONTACT_ADDRESS = {
  vi: 'Đà Nẵng, Việt Nam',
  en: 'Da Nang, Vietnam',
} as const
export const MARKETING_MAP_URL = 'https://maps.app.goo.gl/UqHpW4ENjPrm4eAb7'
export const MARKETING_FOOTER_TAGLINE = {
  vi: 'Tổng hợp công cụ và giải pháp cho các cửa hàng vừa và nhỏ.',
  en: 'Tools and solutions for small and medium stores.',
} as const
export const MARKETING_SOCIAL_LINKS = [
  { href: 'https://fb.com', match: /https?:\/\/(?:www\.)?(?:facebook|fb)\.com\/?/i },
  { href: 'https://instagram.com', match: /https?:\/\/(?:www\.)?instagram\.com\/?/i },
] as const
/** App path the "Get started" buttons open. Same destination on every page. */
export const MARKETING_CTA_PATH = '/'

const FALLBACK_NAV_CLASS = 'nav_links w-nav-link'

export function isMarketingNavItemActive(pathname: string, href: string): boolean {
  const path = (pathname.split('?')[0] || '/').replace(/\/$/, '') || '/'
  if (href === '/') return path === '/'
  return path === href || path.startsWith(`${href}/`)
}

function extractNavLinkClass(listHtml: string): string {
  const match = listHtml.match(/class="([^"]*\bnav_links\b[^"]*)"/i)
  if (!match) return FALLBACK_NAV_CLASS
  const classes = match[1]
    .split(/\s+/)
    .filter((cls) => cls && cls !== 'w--current')
  return classes.length > 0 ? classes.join(' ') : FALLBACK_NAV_CLASS
}

function buildNavbarListHtml(
  existingListHtml: string,
  pathname: string,
  locale: SupportedLocale,
): string {
  const className = extractNavLinkClass(existingListHtml)
  const items = MARKETING_NAV_ITEMS.map((item) => {
    const active = isMarketingNavItemActive(pathname, item.href)
    const href = marketingPathForLocale(item.href, locale)
    const currentAttr = active ? ' aria-current="page"' : ''
    const cls = active ? `${className} w--current` : className
    return `<a href="${escapeHtml(href)}" navbar="item"${currentAttr} class="${cls}">${escapeHtml(item.labels[locale])}</a>`
  }).join('\n                  ')
  return `<div class="navbar_list">\n                  ${items}\n                </div>`
}

/** Replace every Webflow-copied nav list with the canonical links. */
export function rewriteMarketingNavbarList(
  html: string,
  pathname: string,
  locale: SupportedLocale,
): string {
  return html.replace(
    /<div class="navbar_list">[\s\S]*?<\/div>/gi,
    (full) => {
      const inner = full.replace(/^<div class="navbar_list">/i, '').replace(/<\/div>$/i, '')
      return buildNavbarListHtml(inner, pathname, locale)
    },
  )
}

/** Home logo is current only on `/`; inner pages must not keep a leftover current state. */
export function rewriteMarketingNavbarLogoState(html: string, pathname: string): string {
  const isHome = isMarketingNavItemActive(pathname, '/')
  return html.replace(
    /<a\s+([^>]*class="[^"]*navbar_logo-link[^"]*"[^>]*)>/gi,
    (_full, attrs: string) => {
      let next = String(attrs).replace(/\s*aria-current="[^"]*"/gi, '')
      next = next.replace(/\s*class="([^"]*)"/i, (_m: string, cls: string) => {
        const classes = cls.split(/\s+/).filter((c) => c && c !== 'w--current')
        if (isHome) classes.push('w--current')
        return ` class="${classes.join(' ')}"`
      })
      if (isHome) next = ` aria-current="page"${next}`
      return `<a${next}>`
    },
  )
}

export function rewriteMarketingCtaLinks(html: string, ctaHref: string): string {
  return html.replace(
    /href="https?:\/\/app\.eateryvn\.com\/?"/gi,
    `href="${escapeHtml(ctaHref)}"`,
  )
}

export function rewriteMarketingFooterContact(
  html: string,
  locale: SupportedLocale = 'vi',
): string {
  const email = MARKETING_CONTACT_EMAIL
  const address = MARKETING_CONTACT_ADDRESS[locale]
  const tagline = MARKETING_FOOTER_TAGLINE[locale]
  let out = html
    .replace(/mailto:Nextbit@company\.com/gi, `mailto:${email}`)
    .replace(/Nextbit@company\.com/gi, email)

  out = out.replace(
    /<a href="mailto:[^"]*" class="footer_link w-inline-block">\s*<div>[^<]*<\/div>\s*<\/a>/i,
    `<a href="mailto:${escapeHtml(email)}" class="footer_link w-inline-block">\n                      <div>${escapeHtml(email)}</div>\n                    </a>`,
  )

  out = out.replace(
    /<a href="https:\/\/maps\.app\.goo\.gl\/[^"]*" class="footer_link w-inline-block">\s*<div>[^<]*<\/div>\s*<\/a>/i,
    `<a href="${escapeHtml(MARKETING_MAP_URL)}" class="footer_link w-inline-block">\n                      <div>${escapeHtml(address)}</div>\n                    </a>`,
  )

  out = out.replace(
    /(<div class="footer_header">[\s\S]*?<div class="text-color-on-primary">)[\s\S]*?(<\/div>)/i,
    `$1${escapeHtml(tagline)}$2`,
  )

  for (const social of MARKETING_SOCIAL_LINKS) {
    out = out.replace(
      new RegExp(`href="${social.match.source}[^"]*"`, 'gi'),
      `href="${social.href}"`,
    )
  }

  if (!/\sid="contact"/i.test(out)) {
    out = out.replace(
      /<div class="footer_contact">/i,
      '<div id="contact" class="footer_contact">',
    )
  }

  return out
}

export function rewriteMarketingChromeShared(
  html: string,
  pathname: string,
  locale: SupportedLocale,
): string {
  let out = rewriteMarketingNavbarList(html, pathname, locale)
  out = rewriteMarketingNavbarLogoState(out, pathname)
  out = rewriteMarketingFooterContact(out, locale)
  return out
}
