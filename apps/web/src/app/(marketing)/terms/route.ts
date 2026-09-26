import { finalizeMarketingHtml, MARKETING_HTML_HEADERS } from '@/lib/marketing-html-response'
import { getMarketingLocaleFromRequest } from '@/lib/marketing-locale'
import { renderLegalPageHtml } from '@/lib/marketing-legal'
import { loadMarketingHtmlDocument } from '@/lib/marketing-webflow'

export const dynamic = 'force-dynamic'

const NOT_FOUND_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store',
} as const

export function GET(request: Request) {
  const locale = getMarketingLocaleFromRequest(request)
  const base = loadMarketingHtmlDocument('explore') ?? loadMarketingHtmlDocument('features')
  if (!base) return new Response('Not found', { status: 404, headers: NOT_FOUND_HEADERS })
  const rendered = renderLegalPageHtml(base, 'terms', locale)
  return new Response(
    finalizeMarketingHtml(rendered, request, locale, { pageSlug: 'terms' }),
    { headers: MARKETING_HTML_HEADERS },
  )
}
