import { cookies } from 'next/headers'
import type { SupportedLocale } from '@/i18n/locale'
import { isSupportedLocale, LOCALE_LABELS } from '@/i18n/locale'

export const MARKETING_LOCALE_COOKIE = 'NEXT_LOCALE'

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

export function resolveMarketingLocale(value: string | null | undefined): SupportedLocale {
  return isSupportedLocale(value) ? value : 'vi'
}

export async function getMarketingLocaleFromCookies(): Promise<SupportedLocale> {
  const cookieStore = await cookies()
  return resolveMarketingLocale(cookieStore.get(MARKETING_LOCALE_COOKIE)?.value)
}

export function getMarketingLocaleFromRequest(request: Request): SupportedLocale {
  const cookie = request.headers.get('cookie') ?? ''
  const match = cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)
  return resolveMarketingLocale(match?.[1] ? decodeURIComponent(match[1]) : null)
}

export function collectionIdToLocale(collectionId: string): SupportedLocale | null {
  const id = collectionId.trim().toLowerCase()
  if (id === 'vi') return 'vi'
  if (id === 'en') return 'en'
  return null
}

export { LOCALE_LABELS }
