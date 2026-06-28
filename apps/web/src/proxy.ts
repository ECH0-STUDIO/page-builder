import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import {
  appPath,
  getAppHostname,
  getMarketingHostname,
  isAppOnlyPath,
  isMarketingPath,
  isPublicSlugPath,
  isSplitDomainDeployment,
  marketingPath,
} from '@/lib/site-urls'

function hostMatches(requestHost: string | undefined, configuredHost: string): boolean {
  if (!requestHost) return false
  const host = requestHost.toLowerCase()
  const target = configuredHost.toLowerCase()
  return host === target || host === `www.${target}`
}

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

  if (!langCookie) {
    const countryLangMap: Record<string, string> = {
      VN: 'vi',
      TH: 'th',
      CN: 'zh', HK: 'zh', TW: 'zh', MO: 'zh',
      JP: 'ja',
      KR: 'ko',
      FR: 'fr', BE: 'fr', CH: 'fr',
      DE: 'de', AT: 'de',
      ES: 'es', MX: 'es', AR: 'es', CO: 'es',
      ID: 'id',
      MY: 'ms', SG: 'ms', BN: 'ms',
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

  supabaseResponse.headers.set('x-user-country', country)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname, search } = request.nextUrl
  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase()

  const marketingHost = getMarketingHostname()
  const appHost = getAppHostname()
  const isLocalHost = host === 'localhost' || host === '127.0.0.1'
  const splitDomains = isSplitDomainDeployment() && !isLocalHost

  const isMarketingHost = splitDomains && hostMatches(host, marketingHost)
  const isAppHost = splitDomains && hostMatches(host, appHost)

  const isPlatformHost =
    isLocalHost ||
    hostMatches(host, appHost) ||
    hostMatches(host, marketingHost) ||
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
  if (isMarketingHost) {
    // App routes (login, dashboard, etc.) live on the app subdomain.
    // Public store pages (/slug) are served on the marketing host too.
    if (isAppOnlyPath(pathname)) {
      return NextResponse.redirect(appPath(pathname + search))
    }
  }

  if (isAppHost) {
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
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}
