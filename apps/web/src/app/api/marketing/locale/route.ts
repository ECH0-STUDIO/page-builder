import { NextResponse } from 'next/server'
import { isSupportedLocale } from '@/i18n/locale'
import { currencyForLocale, localeCookieOptions } from '@/lib/locale-cookie'
import {
  marketingPathForLocale,
  marketingRedirectUrl,
  resolveMarketingLocale,
} from '@/lib/marketing-locale'

/** @deprecated Prefer direct links with `?lang=en` from the marketing language switcher. */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const lang = url.searchParams.get('lang')
  const redirect = url.searchParams.get('redirect') || '/'

  if (!isSupportedLocale(lang)) {
    return NextResponse.redirect(marketingRedirectUrl(request, '/'))
  }

  const basePath = redirect.startsWith('/') ? redirect.split('?')[0] : '/'
  const target = marketingPathForLocale(basePath, resolveMarketingLocale(lang))
  const response = NextResponse.redirect(marketingRedirectUrl(request, target))
  const options = localeCookieOptions()
  response.cookies.set('NEXT_LOCALE', lang, options)
  response.cookies.set('NEXT_CURRENCY', currencyForLocale(lang), options)
  return response
}
