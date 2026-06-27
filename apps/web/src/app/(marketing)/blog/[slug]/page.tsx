import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { MarketingCta } from '@/components/marketing/MarketingCta'
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
  return {
    title: post.title,
    description: post.excerpt,
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getBlogPost(slug)
  if (!post) notFound()

  const paragraphs = renderBlogBody(post.body)

  return (
    <MarketingShell activeNav="/blog">
      <article className="py-16 lg:py-24">
        <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <Link href="/blog" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
              ← Back to blog
            </Link>

            <header className="mt-8 mb-10">
              <time className="text-sm text-gray-500">
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              <h1 className="mt-3 text-4xl font-bold text-gray-900 tracking-tight">{post.title}</h1>
              <p className="mt-4 text-lg text-gray-600">{post.excerpt}</p>
              <p className="mt-4 text-sm text-gray-500">By {post.author}</p>
            </header>

            <div className="prose prose-gray max-w-none space-y-5 text-gray-700 leading-relaxed">
              {paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </article>
      <MarketingCta />
    </MarketingShell>
  )
}
