import { marketingHtmlResponse } from '@/lib/marketing-html-response'

export const dynamic = 'force-dynamic'

export function GET() {
  return marketingHtmlResponse('index')
}
