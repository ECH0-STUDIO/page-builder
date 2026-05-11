import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Vercel populates this header automatically in production.
  // We default to 'US' for local development testing.
  const country = request.headers.get('x-vercel-ip-country') || 'US'
  
  const langCookie = request.cookies.get('NEXT_LOCALE')?.value
  const currencyCookie = request.cookies.get('NEXT_CURRENCY')?.value

  const isVN = country === 'VN'
  const defaultLang = isVN ? 'vi' : 'en'
  const defaultCurrency = isVN ? 'VND' : 'USD'

  const response = NextResponse.next()
  
  // Set the default locale and currency cookies if they haven't been manually overridden
  if (!langCookie) {
    response.cookies.set('NEXT_LOCALE', defaultLang, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })
  }
  
  if (!currencyCookie) {
    response.cookies.set('NEXT_CURRENCY', defaultCurrency, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })
  }

  // Also pass the country code as a custom header just in case server components need it
  response.headers.set('x-user-country', country)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
