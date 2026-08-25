import type { SupportedLocale } from '@/i18n/locale'
import { escapeHtml } from '@/lib/marketing-blog-html'
import { marketingPathForLocale } from '@/lib/marketing-locale'
import { MARKETING_SHOW_SOCIAL_LINKS } from '@/lib/marketing-assets'

/**
 * Shared marketing chrome (nav, footer, CTA).
 * Applied on every marketing HTML response so pages stay in sync.
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
export const MARKETING_FOOTER_OFFICE_LABEL = {
  vi: 'Văn phòng',
  en: 'Our Office',
} as const
export const MARKETING_FOOTER_FOLLOW_LABEL = {
  vi: 'Theo dõi',
  en: 'Follow',
} as const
export const MARKETING_SOCIAL_LINKS = [
  { href: 'https://fb.com', match: /https?:\/\/(?:www\.)?(?:facebook|fb)\.com\/?/i },
  { href: 'https://instagram.com', match: /https?:\/\/(?:www\.)?instagram\.com\/?/i },
] as const

/** Instagram glyph (footer previously shipped a TikTok path on the Instagram link). */
const INSTAGRAM_ICON_PATH =
  'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z'
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

  out = out.replace(
    /(<div class="footer_data">\s*<div class="text-lg text-color-on-primary text-weight-medium">)[^<]*(<\/div>)/i,
    `$1${escapeHtml(MARKETING_FOOTER_OFFICE_LABEL[locale])}$2`,
  )

  if (!MARKETING_SHOW_SOCIAL_LINKS) {
    out = out.replace(
      /<div class="footer_social"([^>]*)>/i,
      '<div class="footer_social"$1 hidden style="display:none">',
    )
  } else {
    out = out.replace(
      /(<div class="footer_social">\s*<div class="text-lg text-color-on-primary text-weight-medium">)[^<]*(<\/div>)/i,
      `$1${escapeHtml(MARKETING_FOOTER_FOLLOW_LABEL[locale])}$2`,
    )

    for (const social of MARKETING_SOCIAL_LINKS) {
      out = out.replace(
        new RegExp(`href="${social.match.source}[^"]*"`, 'gi'),
        `href="${social.href}"`,
      )
    }

    // Fix Instagram icon path (export used a TikTok glyph).
    out = out.replace(
      /(<a href="https:\/\/instagram\.com"[^>]*>[\s\S]*?<path d=")([^"]+)(")/i,
      `$1${INSTAGRAM_ICON_PATH}$3`,
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

export function rewriteMarketingNotFoundCopy(html: string, locale: SupportedLocale): string {
  if (locale !== 'vi') return html
  return html
    .replace(/>Page not <em>found<\/em></i, '>Không tìm thấy <em>trang</em>')
    .replace(/>Go to home</gi, '>Về trang chủ<')
}

export function rewriteMarketingChromeShared(
  html: string,
  pathname: string,
  locale: SupportedLocale,
): string {
  let out = rewriteMarketingNavbarList(html, pathname, locale)
  out = rewriteMarketingNavbarLogoState(out, pathname)
  out = rewriteMarketingFooterContact(out, locale)
  out = rewriteMarketingNotFoundCopy(out, locale)
  return out
}
