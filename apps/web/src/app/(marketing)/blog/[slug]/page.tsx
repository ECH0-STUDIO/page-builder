import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import { marketingPageExists } from '@/lib/marketing-webflow'
import { getWebflowMetadata, renderWebflowMarketingPage } from '@/components/marketing/render-webflow-page'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (marketingPageExists('detail_blog')) {
    return getWebflowMetadata('detail_blog')
  }
  return { title: slug }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  void slug
  if (marketingPageExists('detail_blog')) {
    return renderWebflowMarketingPage('detail_blog')
  }
  if (marketingPageExists('blog')) {
    permanentRedirect('/blog')
  }
  permanentRedirect('/#blog')
}
