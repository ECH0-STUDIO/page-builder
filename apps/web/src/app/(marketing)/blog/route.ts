import { marketingBlogListHtmlResponse, marketingHtmlOrRedirect } from '@/lib/marketing-html-response'
import { marketingPageExists } from '@/lib/marketing-webflow'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (marketingPageExists('blog')) {
    return marketingBlogListHtmlResponse()
  }
  return marketingHtmlOrRedirect('blog', '/#blog', request)
}
