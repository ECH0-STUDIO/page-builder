import Link from 'next/link'
import type { BlogPost } from '@/lib/blog'
import { appPath } from '@/lib/site-urls'

export function NexbetBlogSection({ posts }: { posts: BlogPost[] }) {
  return (
    <section id="blog" className="section_blog">
      <div className="padding-section-medium" />
      <div className="padding-global">
        <div className="container-large">
          <div className="blog_layout">
            <div className="blog_header">
              <div className="tag-item w-variant-17e1f4b8-a107-555d-b66e-feb7c5abc5b1">
                <div>Blog</div>
              </div>
              <div className="max-title is-30rem">
                <h2 className="text-align-center">Tips for going digital</h2>
              </div>
              <div className="blog_header-bottom">
                <div className="max-description is-23rem">
                  <div className="text-color-secondary text-align-center">
                    Menus, QR codes, and credit-based pricing for modern restaurants.
                  </div>
                </div>
                <Link href="/blog" className="button w-inline-block">
                  <div className="button_mask">
                    <div className="button_text">View all posts</div>
                    <div className="button_text is-hide">View all posts</div>
                  </div>
                </Link>
              </div>
            </div>
            <div className="blog_wrap">
              <div className="blog_list" style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                {posts.slice(0, 3).map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-item w-inline-block">
                    <div className="blog_item_content">
                      <div className="pill-item" style={{ marginBottom: '0.75rem', display: 'inline-flex' }}>
                        <div>
                          {new Date(post.publishedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
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

export function NexbetCta() {
  return (
    <section className="section_impacts" style={{ background: 'var(--base--black, #111)' }}>
      <div className="padding-section-medium" />
      <div className="padding-global">
        <div className="container-large" style={{ textAlign: 'center' }}>
          <h2 className="text-align-center" style={{ color: '#fff', marginBottom: '1rem' }}>
            Ready to launch your menu online?
          </h2>
          <p className="text-color-secondary" style={{ maxWidth: '32rem', margin: '0 auto 2rem' }}>
            Start free on the app. Buy credits only when you need premium features.
          </p>
          <div className="buttons-group" style={{ justifyContent: 'center' }}>
            <a href={appPath('/signup')} className="button-icon w-inline-block">
              <div className="button_mask">
                <div className="button_text">Create free account</div>
                <div className="button_text is-hide">Create free account</div>
              </div>
            </a>
            <Link href="/pricing" className="button w-variant-afd4be8c-cefc-38d4-ee66-8fdad5b98c2b w-inline-block">
              <div className="button_mask">
                <div className="button_text">See pricing</div>
                <div className="button_text is-hide">See pricing</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
      <div className="padding-section-medium" />
    </section>
  )
}
