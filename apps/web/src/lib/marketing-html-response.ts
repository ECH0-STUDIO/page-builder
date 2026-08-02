import { NextResponse } from 'next/server'
import type { SupportedLocale } from '@/i18n/locale'
import { getAllBlogPosts, getBlogPost, getBlogPostByItemId, getBlogPosts } from '@/lib/blog'
import { injectMarketingChrome } from '@/lib/marketing-chrome'
import {
  renderBlogDetailHtml,
  renderBlogListHtml,
  renderMarketingIndexHtml,
} from '@/lib/marketing-blog-html'
import { getMarketingLocaleFromRequest, marketingCanonicalPath, marketingPathForLocale, marketingRedirectUrl, rewriteMarketingInternalLinks } from '@/lib/marketing-locale'
import { applyMarketingI18n } from '@/lib/marketing-i18n'
import { applyMarketingSeo, resolveMarketingPageSlug, type MarketingSeoOverrides } from '@/lib/marketing-seo'
import { loadMarketingHtmlDocument, marketingPageExists } from '@/lib/marketing-webflow'

const HTML_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store',
} as const

function pathnameFromRequest(request: Request): string {
  return new URL(request.url).pathname
}

type FinalizeOptions = {
  localePaths?: Partial<Record<SupportedLocale, string>>
  seo?: MarketingSeoOverrides
}

function finalizeMarketingHtml(
  html: string,
  request: Request,
  locale: SupportedLocale,
  options?: FinalizeOptions,
): string {
  const pathname = pathnameFromRequest(request)
  const pageSlug = resolveMarketingPageSlug(pathname)
  const canonicalPath = options?.seo?.canonicalPath ?? marketingCanonicalPath(pathname, locale)
  const withSeo = applyMarketingSeo(html, pageSlug, locale, {
    canonicalPath,
    ...options?.seo,
  })
  const translated = applyMarketingI18n(withSeo, locale)
  const withLinks = rewriteMarketingInternalLinks(translated, locale)
  // Inject switcher last so rewrite step cannot strip ?lang=en from EN links.
  return injectMarketingChrome(withLinks, locale, pathname, options?.localePaths)
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
  const html = loadMarketingHtmlDocument('blog') ?? loadMarketingHtmlDocument('index')
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
        return NextResponse.redirect(
          marketingRedirectUrl(
            request,
            marketingPathForLocale(`/blog/${localized.slug}`, locale),
          ),
        )
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
  const viSlug = locale === 'vi' ? post.slug : alternate?.slug ?? post.slug
  const enSlug = locale === 'en' ? post.slug : alternate?.slug ?? post.slug
  const localePaths = {
    vi: marketingPathForLocale(`/blog/${viSlug}`, 'vi'),
    en: marketingPathForLocale(`/blog/${enSlug}`, 'en'),
  }

  return new Response(
    finalizeMarketingHtml(rendered, request, locale, {
      localePaths,
      seo: {
        blogPost: post,
        canonicalPath: marketingPathForLocale(`/blog/${post.slug}`, locale),
      },
    }),
    { headers: HTML_HEADERS },
  )
}

export function marketingHtmlOrRedirect(slug: string, fallbackPath: string, request: Request): Response {
  const locale = getMarketingLocaleFromRequest(request)
  if (marketingPageExists(slug)) {
    return marketingHtmlResponse(slug, request)
  }
  return NextResponse.redirect(
    marketingRedirectUrl(request, marketingPathForLocale(fallbackPath, locale)),
  )
}
