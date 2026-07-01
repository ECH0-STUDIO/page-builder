import { NextResponse } from 'next/server'
import { getBlogPost, getBlogPosts } from '@/lib/blog'
import { renderBlogDetailHtml, renderBlogListHtml, renderMarketingIndexHtml } from '@/lib/marketing-blog-html'
import { loadMarketingHtmlDocument, marketingPageExists } from '@/lib/marketing-webflow'

const HTML_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store',
} as const

export function marketingHtmlResponse(slug: string): Response {
  const html = loadMarketingHtmlDocument(slug)
  if (!html) {
    return new Response('Not found', { status: 404 })
  }
  return new Response(html, { headers: HTML_HEADERS })
}

export async function marketingIndexHtmlResponse(): Promise<Response> {
  const html = loadMarketingHtmlDocument('index')
  if (!html) {
    return new Response('Not found', { status: 404 })
  }
  const posts = await getBlogPosts()
  return new Response(renderMarketingIndexHtml(html, posts), { headers: HTML_HEADERS })
}

export async function marketingBlogListHtmlResponse(): Promise<Response> {
  const html = loadMarketingHtmlDocument('blog')
  if (!html) {
    return new Response('Not found', { status: 404 })
  }
  const posts = await getBlogPosts()
  return new Response(renderBlogListHtml(html, posts), { headers: HTML_HEADERS })
}

export async function marketingBlogDetailHtmlResponse(slug: string): Promise<Response> {
  if (!marketingPageExists('detail_blog')) {
    return new Response('Not found', { status: 404 })
  }

  const post = await getBlogPost(slug)
  if (!post) {
    return new Response('Not found', { status: 404 })
  }

  const base = loadMarketingHtmlDocument('detail_blog')
  if (!base) {
    return new Response('Not found', { status: 404 })
  }

  const allPosts = await getBlogPosts()
  const html = renderBlogDetailHtml(base, post, allPosts)
  return new Response(html, { headers: HTML_HEADERS })
}

export function marketingHtmlOrRedirect(slug: string, fallbackPath: string, request: Request): Response {
  if (marketingPageExists(slug)) {
    return marketingHtmlResponse(slug)
  }
  return NextResponse.redirect(new URL(fallbackPath, request.url))
}
