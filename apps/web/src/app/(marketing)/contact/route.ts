import { marketingHtmlOrRedirect } from '@/lib/marketing-html-response'

export const dynamic = 'force-dynamic'

export function GET(request: Request) {
  return marketingHtmlOrRedirect('contact', '/#contact', request)
}
