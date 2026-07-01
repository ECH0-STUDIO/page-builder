import { NextResponse } from 'next/server'
import { loadMarketingHtmlDocument, marketingPageExists } from '@/lib/marketing-webflow'

export function marketingHtmlResponse(slug: string): Response {
  const html = loadMarketingHtmlDocument(slug)
  if (!html) {
    return new Response('Not found', { status: 404 })
  }
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

export function marketingHtmlOrRedirect(slug: string, fallbackPath: string, request: Request): Response {
  if (marketingPageExists(slug)) {
    return marketingHtmlResponse(slug)
  }
  return NextResponse.redirect(new URL(fallbackPath, request.url))
}
