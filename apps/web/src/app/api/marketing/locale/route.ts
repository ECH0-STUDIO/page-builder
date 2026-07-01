import { NextResponse } from 'next/server'
import { isSupportedLocale } from '@/i18n/locale'
import { currencyForLocale, localeCookieOptions } from '@/lib/locale-cookie'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const lang = url.searchParams.get('lang')
  const redirect = url.searchParams.get('redirect') || '/'

  if (!isSupportedLocale(lang)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const target = redirect.startsWith('/') ? redirect : '/'
  const response = NextResponse.redirect(new URL(target, request.url))
  const options = localeCookieOptions()
  response.cookies.set('NEXT_LOCALE', lang, options)
  response.cookies.set('NEXT_CURRENCY', currencyForLocale(lang), options)
  return response
}
