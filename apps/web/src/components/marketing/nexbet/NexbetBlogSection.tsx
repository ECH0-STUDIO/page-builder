import Link from 'next/link'
import type { BlogPost } from '@/lib/blog'
import type { SupportedLocale } from '@/i18n/locale'
import { getMarketingCopy } from '@/lib/marketing-copy'
import { marketingPathForLocale } from '@/lib/marketing-locale'
import { appPath } from '@/lib/site-urls'

function formatPostDate(iso: string, locale: SupportedLocale): string {
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`)
  return d.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function NexbetBlogSection({ locale, posts }: { locale: SupportedLocale; posts: BlogPost[] }) {
  const copy = getMarketingCopy(locale)

  return (
    <section id="blog" className="section_blog">
      <div className="padding-section-medium" />
      <div className="padding-global">
        <div className="container-large">
          <div className="blog_layout">
            <div className="blog_header">
              <div className="tag-item w-variant-17e1f4b8-a107-555d-b66e-feb7c5abc5b1">
                <div>{copy.blog.badge}</div>
              </div>
              <div className="max-title is-30rem">
                <h2 className="text-align-center">{copy.blog.title}</h2>
              </div>
              <div className="blog_header-bottom">
                <div className="max-description is-23rem">
                  <div className="text-color-secondary text-align-center">{copy.blog.description}</div>
                </div>
                <Link href={marketingPathForLocale('/blog', locale)} className="button w-inline-block">
                  <div className="button_mask">
                    <div className="button_text">{copy.blog.viewAll}</div>
                    <div className="button_text is-hide">{copy.blog.viewAll}</div>
                  </div>
                </Link>
              </div>
            </div>
            <div className="blog_wrap">
              <div
                className="blog_list"
                style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
              >
                {posts.slice(0, 3).map((post) => (
                  <Link
                    key={post.slug}
                    href={marketingPathForLocale(`/blog/${post.slug}`, locale)}
                    className="blog-item w-inline-block"
                  >
                    <div className="blog_item_content">
                      <div className="pill-item" style={{ marginBottom: '0.75rem', display: 'inline-flex' }}>
                        <div>{formatPostDate(post.publishedAt, locale)}</div>
                      </div>
                      <h3 className="h5 text-style-2lines">{post.title}</h3>
                      <div className="text-color-secondary text-style-2lines">{post.excerpt}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="padding-section-medium" />
    </section>
  )
}

export function NexbetCta({ locale }: { locale: SupportedLocale }) {
  const copy = getMarketingCopy(locale)

  return (
    <section className="section_impacts" style={{ background: 'var(--base--black, #111)' }}>
      <div className="padding-section-medium" />
      <div className="padding-global">
        <div className="container-large" style={{ textAlign: 'center' }}>
          <h2 className="text-align-center" style={{ color: '#fff', marginBottom: '1rem' }}>
            {copy.cta.title}
          </h2>
          <p className="text-color-secondary" style={{ maxWidth: '32rem', margin: '0 auto 2rem' }}>
            {copy.cta.description}
          </p>
          <div className="buttons-group" style={{ justifyContent: 'center' }}>
            <a href={appPath('/signup')} className="button-icon w-inline-block">
              <div className="button_mask">
                <div className="button_text">{copy.cta.primary}</div>
                <div className="button_text is-hide">{copy.cta.primary}</div>
              </div>
            </a>
            <Link href={marketingPathForLocale('/pricing', locale)} className="button w-variant-afd4be8c-cefc-38d4-ee66-8fdad5b98c2b w-inline-block">
              <div className="button_mask">
                <div className="button_text">{copy.cta.secondary}</div>
                <div className="button_text is-hide">{copy.cta.secondary}</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
      <div className="padding-section-medium" />
    </section>
  )
}
