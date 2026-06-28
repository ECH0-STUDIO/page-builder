import type { Metadata } from 'next'
import Link from 'next/link'
import { NexbetShell } from '@/components/marketing/nexbet/NexbetShell'
import { NexbetPageHeader } from '@/components/marketing/nexbet/NexbetPageHeader'
import { NexbetCta } from '@/components/marketing/nexbet/NexbetBlogSection'
import { getBlogPosts } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Tips for restaurants going digital — menus, QR codes, and credit-based pricing.',
}

export const revalidate = 300

export default async function BlogIndexPage() {
  const posts = await getBlogPosts()

  return (
    <NexbetShell>
      <NexbetPageHeader
        badge="Blog"
        title="Ideas for modern restaurants"
        description="Practical guides on digital menus, pricing, and launching without a big agency budget."
      />
      <section className="section_blog">
        <div className="padding-global">
          <div className="container-large">
            <div className="blog_list" style={{ display: 'grid', gap: '1.5rem' }}>
              {posts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-item w-inline-block">
                  <div className="blog_item_content">
                    <div className="pill-item" style={{ marginBottom: '0.75rem', display: 'inline-flex' }}>
                      <div>
                        {new Date(post.publishedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
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
      <NexbetCta />
    </NexbetShell>
  )
}
