import { marketingBlogListHtmlResponse } from '@/lib/marketing-html-response'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  return marketingBlogListHtmlResponse(request)
}
