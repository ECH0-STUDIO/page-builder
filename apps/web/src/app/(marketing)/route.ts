import { marketingIndexHtmlResponse } from '@/lib/marketing-html-response'

export const dynamic = 'force-dynamic'

export function GET() {
  return marketingIndexHtmlResponse()
}
