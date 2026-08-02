import { marketingBlogDetailHtmlResponse, marketingHtmlOrRedirect } from '@/lib/marketing-html-response'
import { marketingPageExists } from '@/lib/marketing-webflow'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function GET(request: Request, { params }: Props) {
  const { slug } = await params
  if (marketingPageExists('detail_blog')) {
    return marketingBlogDetailHtmlResponse(slug, request)
  }
  return marketingHtmlOrRedirect('blog', '/#blog', request)
}
