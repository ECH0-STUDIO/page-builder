import { NextResponse } from 'next/server'
import type { SupportedLocale } from '@/i18n/locale'
import { getAllBlogPosts, getBlogPost, getBlogPostByItemId, getBlogPosts } from '@/lib/blog'
import { injectMarketingChrome } from '@/lib/marketing-chrome'
import {
  renderBlogDetailHtml,
  renderBlogListHtml,
  renderMarketingIndexHtml,
} from '@/lib/marketing-blog-html'
import { getMarketingLocaleFromRequest } from '@/lib/marketing-locale'
import { loadMarketingHtmlDocument, marketingPageExists } from '@/lib/marketing-webflow'

const HTML_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store',
} as const

function pathnameFromRequest(request: Request): string {
  return new URL(request.url).pathname
}

function finalizeMarketingHtml(
  html: string,
  request: Request,
  locale: SupportedLocale,
  localePaths?: Partial<Record<SupportedLocale, string>>,
): string {
  return injectMarketingChrome(html, locale, pathnameFromRequest(request), localePaths)
}

export function marketingHtmlResponse(slug: string, request: Request): Response {
  const locale = getMarketingLocaleFromRequest(request)
  const html = loadMarketingHtmlDocument(slug)
  if (!html) {
    return new Response('Not found', { status: 404 })
  }
  return new Response(finalizeMarketingHtml(html, request, locale), { headers: HTML_HEADERS })
}

export async function marketingIndexHtmlResponse(request: Request): Promise<Response> {
  const locale = getMarketingLocaleFromRequest(request)
  const html = loadMarketingHtmlDocument('index')
  if (!html) {
    return new Response('Not found', { status: 404 })
  }
  const posts = await getBlogPosts(locale)
  const rendered = renderMarketingIndexHtml(html, posts, locale)
  return new Response(finalizeMarketingHtml(rendered, request, locale), { headers: HTML_HEADERS })
}

export async function marketingBlogListHtmlResponse(request: Request): Promise<Response> {
  const locale = getMarketingLocaleFromRequest(request)
  const html = loadMarketingHtmlDocument('blog')
  if (!html) {
    return new Response('Not found', { status: 404 })
  }
  const posts = await getBlogPosts(locale)
  const rendered = renderBlogListHtml(html, posts, locale)
  return new Response(finalizeMarketingHtml(rendered, request, locale), { headers: HTML_HEADERS })
}

export async function marketingBlogDetailHtmlResponse(
  slug: string,
  request: Request,
): Promise<Response> {
  if (!marketingPageExists('detail_blog')) {
    return new Response('Not found', { status: 404 })
  }

  const locale = getMarketingLocaleFromRequest(request)
  let post = await getBlogPost(slug, locale)
  if (!post) {
    const all = await getAllBlogPosts()
    const match = all.find((p) => p.slug === slug)
    if (match?.itemId) {
      const localized = await getBlogPostByItemId(match.itemId, locale)
      if (localized) {
        return NextResponse.redirect(new URL(`/blog/${localized.slug}`, request.url))
      }
    }
    return new Response('Not found', { status: 404 })
  }

  const base = loadMarketingHtmlDocument('detail_blog')
  if (!base) {
    return new Response('Not found', { status: 404 })
  }

  const allPosts = await getBlogPosts(locale)
  const rendered = renderBlogDetailHtml(base, post, allPosts, locale)

  const otherLocale: SupportedLocale = locale === 'vi' ? 'en' : 'vi'
  const alternate = post.itemId ? await getBlogPostByItemId(post.itemId, otherLocale) : null
  const localePaths = alternate
    ? { [otherLocale]: `/blog/${alternate.slug}` }
    : undefined

  return new Response(finalizeMarketingHtml(rendered, request, locale, localePaths), {
    headers: HTML_HEADERS,
  })
}

export function marketingHtmlOrRedirect(slug: string, fallbackPath: string, request: Request): Response {
  if (marketingPageExists(slug)) {
    return marketingHtmlResponse(slug, request)
  }
  return NextResponse.redirect(new URL(fallbackPath, request.url))
}
