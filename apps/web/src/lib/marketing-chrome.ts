import type { SupportedLocale } from '@/i18n/locale'
import { appPath } from '@/lib/site-urls'
import { LOCALE_LABELS, marketingPathForLocale } from '@/lib/marketing-locale'
import { escapeHtml } from '@/lib/marketing-blog-html'

const LOCALE_SWITCHER_CSS = `<style id="marketing-locale-styles">
.marketing-locale-switcher{display:inline-flex;align-items:center;gap:.25rem;padding:.2rem;background:rgba(0,0,0,.06);border-radius:999px;font-size:.8125rem;line-height:1}
.marketing-locale-switcher a{display:inline-flex;align-items:center;justify-content:center;min-width:2.25rem;padding:.35rem .55rem;border-radius:999px;color:inherit;text-decoration:none;font-weight:500}
.marketing-locale-switcher a.is-active{background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.08)}
.navbar .marketing-locale-switcher{margin-right:.5rem}
</style>`

function localeSwitchHref(locale: SupportedLocale, pathname: string): string {
  const path = pathname?.startsWith('/') ? pathname.split('?')[0] : '/'
  return marketingPathForLocale(path, locale)
}

export function buildLocaleSwitcher(
  pathname: string,
  activeLocale: SupportedLocale,
  localePaths?: Partial<Record<SupportedLocale, string>>,
): string {
  const locales: SupportedLocale[] = ['vi', 'en']
  const links = locales
    .map((locale) => {
      const active = locale === activeLocale ? ' is-active' : ''
      const short = locale.toUpperCase()
      const title = LOCALE_LABELS[locale]
      const targetPath = localePaths?.[locale] ?? pathname
      return `<a href="${escapeHtml(localeSwitchHref(locale, targetPath))}" class="marketing-locale-link${active}" aria-label="${escapeHtml(title)}" hreflang="${locale}">${short}</a>`
    })
    .join('')
  return `<div class="marketing-locale-switcher" data-marketing-locale>${links}</div>`
}

export function injectMarketingChrome(
  html: string,
  locale: SupportedLocale,
  pathname: string,
  localePaths?: Partial<Record<SupportedLocale, string>>,
): string {
  let out = html

  out = out.replace(/<html([^>]*)lang="[^"]*"/i, `<html$1lang="${locale}"`)
  if (!out.includes('lang="')) {
    out = out.replace(/<html/i, `<html lang="${locale}"`)
  }

  if (!out.includes('marketing-locale-styles')) {
    out = out.replace(/<\/head>/i, `${LOCALE_SWITCHER_CSS}\n</head>`)
  }

  const switcher = buildLocaleSwitcher(pathname, locale, localePaths)
  if (!out.includes('data-marketing-locale')) {
    if (out.includes('class="nav_buttons-wrap"')) {
      out = out.replace(
        /(<div class="nav_buttons-wrap">)/,
        `$1\n              ${switcher}`,
      )
    } else if (out.includes('class="navbar_content"')) {
      out = out.replace(
        /(<div class="navbar_content">[\s\S]*?)(<div class="menu-button)/,
        `$1${switcher}$2`,
      )
    }
  }

  // Shared favicon with the main app (replace Webflow / Nexbet assets)
  const favicon = '/logo-icon.png'
  out = out.replace(/href="[^"]*(?:favicon|webclip)\.png[^"]*"/gi, `href="${favicon}"`)
  out = out.replace(
    /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*>/gi,
    '',
  )
  out = out.replace(/<link[^>]+rel=["']apple-touch-icon["'][^>]*>/gi, '')
  const iconTags = `<link rel="icon" href="${favicon}" type="image/png">
  <link rel="shortcut icon" href="${favicon}" type="image/png">
  <link rel="apple-touch-icon" href="${favicon}">`
  out = out.replace(/<\/head>/i, `  ${iconTags}\n</head>`)

  // App auth links — locale travels via shared NEXT_LOCALE cookie on .eateryvn.com
  const loginUrl = appPath('/login')
  const signupUrl = appPath('/signup')
  out = out.replace(/href="https?:\/\/app\.eateryvn\.com\/login[^"]*"/gi, `href="${loginUrl}"`)
  out = out.replace(/href="https?:\/\/app\.eateryvn\.com\/signup[^"]*"/gi, `href="${signupUrl}"`)

  return out
}
