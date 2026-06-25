import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // -- Localization Auto-Detection --
  const country = request.headers.get('x-vercel-ip-country') || 'US'
  const langCookie = request.cookies.get('NEXT_LOCALE')?.value
  const currencyCookie = request.cookies.get('NEXT_CURRENCY')?.value

  if (!langCookie) {
    const countryLangMap: Record<string, string> = {
      VN: 'vi', // Vietnam → Vietnamese
      TH: 'th', // Thailand → Thai
      CN: 'zh', HK: 'zh', TW: 'zh', MO: 'zh', // Chinese-speaking
      JP: 'ja', // Japan → Japanese
      KR: 'ko', // Korea → Korean
      FR: 'fr', BE: 'fr', CH: 'fr', // French-speaking
      DE: 'de', AT: 'de', // German-speaking
      ES: 'es', MX: 'es', AR: 'es', CO: 'es', // Spanish-speaking
      ID: 'id', // Indonesia → Bahasa Indonesia
      MY: 'ms', SG: 'ms', BN: 'ms', // Malay-speaking
    }
    const defaultLang = countryLangMap[country] ?? 'en'
    supabaseResponse.cookies.set('NEXT_LOCALE', defaultLang, { path: '/', maxAge: 60 * 60 * 24 * 365 })
  }
  
  if (!currencyCookie) {
    const countryCurrencyMap: Record<string, string> = {
      VN: 'VND', TH: 'THB', JP: 'JPY', KR: 'KRW',
      ID: 'IDR', MY: 'MYR', SG: 'SGD',
      CN: 'CNY', HK: 'HKD', TW: 'TWD',
      FR: 'EUR', DE: 'EUR', ES: 'EUR', AT: 'EUR', BE: 'EUR',
    }
    const defaultCurrency = countryCurrencyMap[country] ?? 'USD'
    supabaseResponse.cookies.set('NEXT_CURRENCY', defaultCurrency, { path: '/', maxAge: 60 * 60 * 24 * 365 })
  }

  // Pass country header to downstream components
  supabaseResponse.headers.set('x-user-country', country)
  // ---------------------------------

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Custom domain routing ──
  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const appHost = new URL(appUrl).hostname.toLowerCase()
  const isLocalHost = host === 'localhost' || host === '127.0.0.1'
  const isPlatformHost =
    isLocalHost ||
    host === appHost ||
    (host?.endsWith('.vercel.app') ?? false)

  if (host && !isPlatformHost && !pathname.startsWith('/api')) {
    const { data: slug } = await supabase.rpc('get_slug_by_custom_domain', { p_domain: host })
    if (slug) {
      const rewriteUrl = request.nextUrl.clone()
      rewriteUrl.pathname = `/${slug}`
      return NextResponse.rewrite(rewriteUrl)
    }
  }

  // Protect dashboard and onboarding routes
  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect logged-in users away from auth pages
  if (
    user &&
    (pathname === '/login' ||
      pathname === '/signup' ||
      pathname === '/forgot-password')
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}
