import type { Metadata } from 'next'
import Link from 'next/link'
import { NexbetShell } from '@/components/marketing/nexbet/NexbetShell'
import { NexbetPageHeader } from '@/components/marketing/nexbet/NexbetPageHeader'
import { NexbetCta } from '@/components/marketing/nexbet/NexbetBlogSection'
import { getBlogPosts } from '@/lib/blog'
import { getMarketingCopy } from '@/lib/marketing-copy'
import { getPageLocale, type MarketingSearchParams } from '@/lib/marketing-page-locale'
import { marketingPathForLocale } from '@/lib/marketing-locale'
import type { SupportedLocale } from '@/i18n/locale'

export const revalidate = 300

type Props = { searchParams: Promise<MarketingSearchParams> }

function formatPostDate(iso: string, locale: SupportedLocale): string {
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`)
  return d.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const locale = getPageLocale(await searchParams)
  const copy = getMarketingCopy(locale)
  return { title: copy.meta.blogTitle, description: copy.meta.blogDescription }
}

export default async function BlogIndexPage({ searchParams }: Props) {
  const locale = getPageLocale(await searchParams)
  const copy = getMarketingCopy(locale)
  const posts = await getBlogPosts(locale)

  return (
    <NexbetShell locale={locale}>
      <NexbetPageHeader badge={copy.blog.badge} title={copy.blog.title} description={copy.blog.description} />
      <section className="section_blog">
        <div className="padding-global">
          <div className="container-large">
            <div className="blog_list" style={{ display: 'grid', gap: '1.5rem' }}>
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={marketingPathForLocale(`/blog/${post.slug}`, locale)}
                  className="blog-item w-inline-block"
                >
                  <div className="blog_item_content">
                    <div className="pill-item" style={{ marginBottom: '0.75rem', display: 'inline-flex' }}>
                      <div>{formatPostDate(post.publishedAt, locale)}</div>
                    </div>
                    <h2 className="h5">{post.title}</h2>
                    <p className="text-color-secondary">{post.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="padding-section-medium" />
      </section>
      <NexbetCta locale={locale} />
    </NexbetShell>
  )
}
