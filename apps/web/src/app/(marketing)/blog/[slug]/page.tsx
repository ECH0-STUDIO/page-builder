import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { NexbetShell } from '@/components/marketing/nexbet/NexbetShell'
import { NexbetCta } from '@/components/marketing/nexbet/NexbetBlogSection'
import { getBlogPost, getBlogPosts, renderBlogBody } from '@/lib/blog'

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const posts = await getBlogPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost(slug)
  if (!post) return { title: 'Post not found' }
  return { title: post.title, description: post.excerpt }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getBlogPost(slug)
  if (!post) notFound()

  const paragraphs = renderBlogBody(post.body)

  return (
    <NexbetShell>
      <div className="padding-section-medium" />
      <div className="padding-global">
        <div className="container-large">
          <article style={{ maxWidth: '42rem', margin: '0 auto' }}>
            <Link href="/blog" className="footer_link w-inline-block" style={{ marginBottom: '1.5rem' }}>
              <div>← Back to blog</div>
            </Link>
            <div className="pill-item" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
              <div>
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
            <h1 className="hero_title" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
              {post.title}
            </h1>
            <p className="text-color-secondary" style={{ marginBottom: '2rem' }}>
              {post.excerpt}
            </p>
            <div className="text-color-secondary" style={{ marginBottom: '0.5rem' }}>
              By {post.author}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '2rem' }}>
              {paragraphs.map((p) => (
                <p key={p.slice(0, 48)} className="text-color-secondary">
                  {p}
                </p>
              ))}
            </div>
          </article>
        </div>
      </div>
      <div className="padding-section-medium" />
      <NexbetCta />
    </NexbetShell>
  )
}
