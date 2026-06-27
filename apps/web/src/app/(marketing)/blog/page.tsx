import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { MarketingCta, PageHeader } from '@/components/marketing/MarketingCta'
import { getBlogPosts } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Tips for restaurants going digital — menus, QR codes, and credit-based pricing.',
}

export const revalidate = 300

export default async function BlogIndexPage() {
  const posts = await getBlogPosts()

  return (
    <MarketingShell activeNav="/blog">
      <section className="py-16 lg:py-24">
        <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
          <PageHeader
            eyebrow="Blog"
            title="Ideas for modern restaurants"
            description="Practical guides on digital menus, pricing, and launching without a big agency budget."
          />

          <div className="max-w-3xl mx-auto space-y-6">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="p-6 lg:p-8 rounded-2xl border border-gray-200 bg-white hover:border-emerald-200 hover:shadow-md transition-all"
              >
                <time className="text-xs font-medium text-gray-500">
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                <h2 className="mt-2 text-xl font-bold text-gray-900">
                  <Link href={`/blog/${post.slug}`} className="hover:text-emerald-700">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-3 text-gray-600 leading-relaxed">{post.excerpt}</p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Read more →
                </Link>
              </article>
            ))}
          </div>

          {!process.env.BLOG_GOOGLE_SHEET_ID && (
            <p className="mt-10 text-center text-xs text-gray-400 max-w-lg mx-auto">
              Showing sample posts. Connect a Google Sheet via BLOG_GOOGLE_SHEET_ID to manage blog content for free.
            </p>
          )}
        </div>
      </section>
      <MarketingCta />
    </MarketingShell>
  )
}
