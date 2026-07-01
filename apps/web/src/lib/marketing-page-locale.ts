import type { SupportedLocale } from '@/i18n/locale'

export function localeFromSearchParam(lang: string | undefined): SupportedLocale {
  return lang === 'en' ? 'en' : 'vi'
}

export type MarketingSearchParams = { lang?: string }

export function getPageLocale(searchParams: MarketingSearchParams): SupportedLocale {
  return localeFromSearchParam(searchParams.lang)
}
