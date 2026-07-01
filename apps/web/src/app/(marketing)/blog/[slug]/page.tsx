import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { NexbetShell } from '@/components/marketing/nexbet/NexbetShell'
import { NexbetCta } from '@/components/marketing/nexbet/NexbetBlogSection'
import { getBlogPost, getBlogPosts } from '@/lib/blog'
import { getMarketingCopy } from '@/lib/marketing-copy'
import { getPageLocale, type MarketingSearchParams } from '@/lib/marketing-page-locale'
import { marketingPathForLocale } from '@/lib/marketing-locale'
import type { SupportedLocale } from '@/i18n/locale'

export const revalidate = 300

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<MarketingSearchParams>
}

function formatPostDate(iso: string, locale: SupportedLocale): string {
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`)
  return d.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export async function generateStaticParams() {
  const [viPosts, enPosts] = await Promise.all([getBlogPosts('vi'), getBlogPosts('en')])
  const slugs = new Set([...viPosts, ...enPosts].map((post) => post.slug))
  return [...slugs].map((slug) => ({ slug }))
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params
  const locale = getPageLocale(await searchParams)
  const post = await getBlogPost(slug, locale)
  if (!post) return { title: 'Post not found' }
  return { title: post.title, description: post.excerpt }
}

export default async function BlogPostPage({ params, searchParams }: Props) {
  const { slug } = await params
  const locale = getPageLocale(await searchParams)
  const copy = getMarketingCopy(locale)
  const post = await getBlogPost(slug, locale)
  if (!post) notFound()

  return (
    <NexbetShell locale={locale}>
      <div className="padding-section-medium" />
      <div className="padding-global">
        <div className="container-large">
          <article style={{ maxWidth: '42rem', margin: '0 auto' }}>
            <Link
              href={marketingPathForLocale('/blog', locale)}
              className="footer_link w-inline-block"
              style={{ marginBottom: '1.5rem' }}
            >
              <div>{copy.blog.backToBlog}</div>
            </Link>
            <div className="pill-item" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
              <div>{formatPostDate(post.publishedAt, locale)}</div>
            </div>
            <h1 className="hero_title" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
              {post.title}
            </h1>
            <p className="text-color-secondary" style={{ marginBottom: '2rem' }}>
              {post.excerpt}
            </p>
            {post.author && (
              <div className="text-color-secondary" style={{ marginBottom: '0.5rem' }}>
                {copy.blog.byAuthor} {post.author}
              </div>
            )}
            {post.body ? (
              <div
                className="text-rich-text w-richtext"
                style={{ marginTop: '2rem' }}
                dangerouslySetInnerHTML={{ __html: post.body }}
              />
            ) : null}
          </article>
        </div>
      </div>
      <div className="padding-section-medium" />
      <NexbetCta locale={locale} />
    </NexbetShell>
  )
}
