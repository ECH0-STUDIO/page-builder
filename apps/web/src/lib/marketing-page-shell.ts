import type { SupportedLocale } from '@/i18n/locale'
import { applyMarketingI18n } from '@/lib/marketing-i18n'
import { injectMarketingChrome } from '@/lib/marketing-chrome'
import { rewriteMarketingInternalLinks } from '@/lib/marketing-locale'
import { loadMarketingHtmlDocument } from '@/lib/marketing-webflow'

export type MarketingShellParts = {
  beforeMain: string
  afterMain: string
}

/** Split Webflow page HTML into chrome (navbar) + footer/scripts around the main section. */
export function splitWebflowMainContent(html: string): MarketingShellParts {
  const navbarIdx = html.search(/class="navbar\b/i)
  const searchFrom = navbarIdx >= 0 ? navbarIdx : 0
  const sectionRel = html.slice(searchFrom).search(/<section\b/i)
  const mainStart = sectionRel >= 0 ? searchFrom + sectionRel : -1
  const footerStart = html.search(/<section class="footer"/i)

  if (mainStart < 0 || footerStart < 0 || footerStart <= mainStart) {
    return { beforeMain: '', afterMain: '' }
  }

  return {
    beforeMain: html.slice(0, mainStart),
    afterMain: html.slice(footerStart),
  }
}

function markExploreNavActive(html: string, pathname: string): string {
  if (!pathname.startsWith('/explore')) return html

  let out = html.replace(/\s+w--current/g, '')
  out = out.replace(/\saria-current="page"/g, '')

  out = out.replace(
    /(<a href="\/explore"[^>]*class=")([^"]*)(")/i,
    '$1$2 w--current$3 aria-current="page"',
  )
  return out
}

/** Load a Webflow marketing shell (navbar + footer) with locale chrome applied. */
export function prepareMarketingShellHtml(
  slug: string,
  locale: SupportedLocale,
  pathname: string,
): MarketingShellParts {
  const raw = loadMarketingHtmlDocument(slug)
  if (!raw) return { beforeMain: '', afterMain: '' }

  let processed = applyMarketingI18n(raw, locale)
  processed = rewriteMarketingInternalLinks(processed, locale)
  processed = injectMarketingChrome(processed, locale, pathname)
  processed = markExploreNavActive(processed, pathname)

  return splitWebflowMainContent(processed)
}
