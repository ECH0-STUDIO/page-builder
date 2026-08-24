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

export function rewriteMarketingFooterContact(html: string): string {
  const email = MARKETING_CONTACT_EMAIL
  return html
    .replace(/mailto:Nextbit@company\.com/gi, `mailto:${email}`)
    .replace(/Nextbit@company\.com/gi, email)
}

export function rewriteMarketingChromeShared(
  html: string,
  pathname: string,
  locale: SupportedLocale,
): string {
  let out = rewriteMarketingNavbarList(html, pathname, locale)
  out = rewriteMarketingNavbarLogoState(out, pathname)
  out = rewriteMarketingFooterContact(out)
  return out
}
