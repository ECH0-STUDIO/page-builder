import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isSupportedLocale } from '@/i18n/locale'
import { currencyForLocale, localeCookieOptions } from '@/lib/locale-cookie'
import {
  inferMarketingLocaleFromCountry,
  isMarketingRoute,
  MARKETING_LANG_PARAM,
} from '@/lib/marketing-locale'
import {
  appPath,
  getAppHostname,
  getMarketingHostname,
  isAppHostname,
  isAppOnlyPath,
  isMarketingHostname,
  isMarketingPath,
  isSplitDomainDeployment,
  marketingPath,
} from '@/lib/site-urls'

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

  const country = request.headers.get('x-vercel-ip-country') || 'US'
  const langCookie = request.cookies.get('NEXT_LOCALE')?.value
  const currencyCookie = request.cookies.get('NEXT_CURRENCY')?.value
  const cookieOptions = localeCookieOptions()

  const { pathname, search } = request.nextUrl
  const langParam = request.nextUrl.searchParams.get(MARKETING_LANG_PARAM)
  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase()

  if (isMarketingRoute(pathname)) {
    if (langParam === 'en') {
      supabaseResponse.cookies.set('NEXT_LOCALE', 'en', cookieOptions)
      supabaseResponse.cookies.set('NEXT_CURRENCY', currencyForLocale('en'), cookieOptions)
    } else if (langParam === 'vi') {
      const cleanUrl = request.nextUrl.clone()
      cleanUrl.searchParams.delete(MARKETING_LANG_PARAM)
      const response = NextResponse.redirect(cleanUrl)
      response.cookies.set('NEXT_LOCALE', 'vi', cookieOptions)
      response.cookies.set('NEXT_CURRENCY', currencyForLocale('vi'), cookieOptions)
      return response
    } else {
      // Clean URL (no ?lang=) is always Vietnamese.
      if (!langCookie || langCookie !== 'vi') {
        supabaseResponse.cookies.set('NEXT_LOCALE', 'vi', cookieOptions)
        supabaseResponse.cookies.set('NEXT_CURRENCY', currencyForLocale('vi'), cookieOptions)
      }
      // First visit from outside Vietnam → send to English URL.
      if (!langCookie && inferMarketingLocaleFromCountry(country, host) === 'en') {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.searchParams.set(MARKETING_LANG_PARAM, 'en')
        const response = NextResponse.redirect(redirectUrl)
        response.cookies.set('NEXT_LOCALE', 'en', cookieOptions)
        response.cookies.set('NEXT_CURRENCY', currencyForLocale('en'), cookieOptions)
        return response
      }
    }
  } else if (!langCookie) {
    supabaseResponse.cookies.set('NEXT_LOCALE', 'vi', cookieOptions)
    supabaseResponse.cookies.set('NEXT_CURRENCY', currencyForLocale('vi'), cookieOptions)
  }

  if (!currencyCookie && langCookie && isSupportedLocale(langCookie)) {
    supabaseResponse.cookies.set('NEXT_CURRENCY', currencyForLocale(langCookie), cookieOptions)
  } else if (!currencyCookie) {
    const countryCurrencyMap: Record<string, string> = {
      VN: 'VND', TH: 'THB', JP: 'JPY', KR: 'KRW',
      ID: 'IDR', MY: 'MYR', SG: 'SGD',
      CN: 'CNY', HK: 'HKD', TW: 'TWD',
      FR: 'EUR', DE: 'EUR', ES: 'EUR', AT: 'EUR', BE: 'EUR',
    }
    const defaultCurrency = countryCurrencyMap[country] ?? 'USD'
    supabaseResponse.cookies.set('NEXT_CURRENCY', defaultCurrency, cookieOptions)
  }

  supabaseResponse.headers.set('x-user-country', country)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const marketingHost = getMarketingHostname()
  const appHost = getAppHostname()
  const isLocalHost = host === 'localhost' || host === '127.0.0.1'
  const splitDomains = isSplitDomainDeployment() && !isLocalHost

  const isMarketingHost = splitDomains && isMarketingHostname(host, marketingHost)
  const isAppHost = splitDomains && isAppHostname(host, appHost)

  const isPlatformHost =
    isLocalHost ||
    isAppHostname(host, appHost) ||
    isMarketingHostname(host, marketingHost) ||
    (host?.endsWith('.vercel.app') ?? false)

  // Supabase may redirect with ?code= on Site URL root
  const authCode = request.nextUrl.searchParams.get('code')
  if (authCode && !pathname.startsWith('/api/auth/callback')) {
    const callbackUrl = request.nextUrl.clone()
    callbackUrl.pathname = '/api/auth/callback'
    if (!callbackUrl.searchParams.has('next')) {
      callbackUrl.searchParams.set('next', '/dashboard')
    }
    if (isMarketingHost) {
      const appCallback = new URL('/api/auth/callback' + callbackUrl.search, appPath('/'))
      return NextResponse.redirect(appCallback)
    }
    return NextResponse.redirect(callbackUrl)
  }

  // ── Marketing vs app subdomain routing ──
  // Marketing host wins when both could match (misconfigured APP_URL on apex/www).
  if (isMarketingHost) {
    if (isAppOnlyPath(pathname)) {
      return NextResponse.redirect(appPath(pathname + search))
    }
  } else if (isAppHost) {
    if (pathname === '/') {
      const dest = user ? '/dashboard' : '/login'
      return NextResponse.redirect(new URL(dest, request.url))
    }
    if (isMarketingPath(pathname) && pathname !== '/') {
      return NextResponse.redirect(marketingPath(pathname + search))
    }
  }

  // ── Custom domain routing ──
  if (host && !isPlatformHost && !pathname.startsWith('/api')) {
    const { data: slug } = await supabase.rpc('get_slug_by_custom_domain', { p_domain: host })
    if (slug) {
      const rewriteUrl = request.nextUrl.clone()
      rewriteUrl.pathname = `/${slug}`
      return NextResponse.rewrite(rewriteUrl)
    }
  }

  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

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
    // Skip Next.js internals (incl. RSC flight requests under /_next) and static assets.
    '/((?!_next|favicon.ico|icon.png|robots.txt|sitemap.xml|api/).*)',
  ],
}
