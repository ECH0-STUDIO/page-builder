import { cookies } from 'next/headers'
import type { SupportedLocale } from '@/i18n/locale'
import { isSupportedLocale, LOCALE_LABELS } from '@/i18n/locale'
import { isMarketingPath } from '@/lib/site-urls'

export const MARKETING_LOCALE_COOKIE = 'NEXT_LOCALE'
export const MARKETING_LANG_PARAM = 'lang'

export const BLOG_META_LABELS: Record<SupportedLocale, [string, string, string]> = {
  vi: ['Ngày đăng', 'Danh mục', 'Thời gian đọc'],
  en: ['Date', 'Category', 'Reading time'],
}

export const BLOG_SECTION_COPY: Record<
  SupportedLocale,
  { badge: string; title: string; description: string; shareArticle: string }
> = {
  vi: {
    badge: 'Tin tức',
    title: 'Tin tức và cập nhật',
    description:
      'Khám phá thông tin cập nhật, mẹo và thủ thuật để sử dụng Eatery một cách hiệu quả nhất.',
    shareArticle: 'Chia sẻ bài viết',
  },
  en: {
    badge: 'Blog',
    title: 'News & updates',
    description:
      'Explore updates, tips, and workflows to get the most out of Eatery for your business.',
    shareArticle: 'Share article',
  },
}

export const MARKETING_BRAND_SUFFIX: Record<SupportedLocale, string> = {
  vi: 'Eatery VN',
  en: 'Eatery',
}

export function isMarketingRoute(pathname: string): boolean {
  return pathname === '/' || isMarketingPath(pathname)
}

export function resolveMarketingLocale(value: string | null | undefined): SupportedLocale {
  return isSupportedLocale(value) ? value : 'vi'
}

export function inferMarketingLocaleFromCountry(
  country: string | null | undefined,
  hostname?: string | null,
): SupportedLocale {
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'vi'
  }
  return country?.toUpperCase() === 'VN' ? 'vi' : 'en'
}

/** Vietnamese uses clean URLs; English uses `?lang=en`. */
export function marketingPathForLocale(pathname: string, locale: SupportedLocale): string {
  const basePath = pathname.split('?')[0] || '/'
  if (locale === 'en') {
    return `${basePath}?${MARKETING_LANG_PARAM}=en`
  }
  return basePath
}

export function marketingCanonicalPath(pathname: string, locale: SupportedLocale): string {
  return marketingPathForLocale(pathname, locale)
}

export function resolveMarketingLocaleFromRequest(request: Request): SupportedLocale {
  const url = new URL(request.url)
  const langParam = url.searchParams.get(MARKETING_LANG_PARAM)
  if (langParam === 'en') return 'en'
  return 'vi'
}

export function getMarketingLocaleFromRequest(request: Request): SupportedLocale {
  return resolveMarketingLocaleFromRequest(request)
}

export async function getMarketingLocaleFromCookies(): Promise<SupportedLocale> {
  const cookieStore = await cookies()
  return resolveMarketingLocale(cookieStore.get(MARKETING_LOCALE_COOKIE)?.value)
}

/** Build redirect URL using the browser host (avoids 0.0.0.0 in local dev). */
export function marketingRedirectUrl(request: Request, pathWithQuery: string): URL {
  const incoming = new URL(request.url)
  const hostHeader = request.headers.get('x-forwarded-host') || request.headers.get('host')
  if (hostHeader) {
    incoming.host = hostHeader.split(',')[0].trim()
  }
  if (incoming.hostname === '0.0.0.0') {
    incoming.hostname = 'localhost'
  }
  return new URL(pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`, incoming.origin)
}

export function collectionIdToLocale(collectionId: string): SupportedLocale | null {
  const id = collectionId.trim().toLowerCase()
  if (id === 'vi') return 'vi'
  if (id === 'en') return 'en'
  return null
}

export { LOCALE_LABELS }
