import { headers } from 'next/headers'
import { marketingNotFoundHtmlResponse } from '@/lib/marketing-html-response'

/**
 * Branded marketing 404 (navbar + footer) when a page is missing.
 * Route handlers return HTML directly; this covers React `notFound()` paths.
 */
export default async function NotFound() {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000'
  const proto = h.get('x-forwarded-proto') || 'http'
  const cookie = h.get('cookie') || ''
  const request = new Request(`${proto}://${host}/404`, {
    headers: cookie ? { cookie } : undefined,
  })
  const response = marketingNotFoundHtmlResponse(request)
  const html = await response.text()
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? '<p>Not found</p>'
  const cssHrefs = [...html.matchAll(/<link[^>]+href=["'](\/marketing\/css\/[^"']+)["'][^>]*>/gi)].map(
    (m) => m[1],
  )
  const styleBlocks = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1])

  return (
    <>
      {cssHrefs.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      {styleBlocks.map((css, i) => (
        <style key={i} dangerouslySetInnerHTML={{ __html: css }} />
      ))}
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: body }} />
    </>
  )
}
