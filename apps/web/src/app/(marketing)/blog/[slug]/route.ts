import { marketingHtmlOrRedirect, marketingHtmlResponse } from '@/lib/marketing-html-response'
import { marketingPageExists } from '@/lib/marketing-webflow'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function GET(request: Request, { params }: Props) {
  const { slug } = await params
  void slug
  if (marketingPageExists('detail_blog')) {
    return marketingHtmlResponse('detail_blog')
  }
  return marketingHtmlOrRedirect('blog', '/#blog', request)
}
