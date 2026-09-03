/**
 * Storefront content locales (guest-facing page/menu language).
 * Separate from dashboard system UI locales (vi | en in I18nProvider).
 */

export const STORE_LOCALE_CODES = [
  'vi',
  'en',
  'de',
  'fr',
  'es',
  'pt',
  'it',
  'nl',
  'pl',
  'ru',
  'ja',
  'ko',
  'zh',
  'th',
  'id',
  'ms',
  'ar',
  'hi',
] as const

export type StoreLocaleCode = (typeof STORE_LOCALE_CODES)[number]

export type StoreLocaleMeta = {
  code: StoreLocaleCode
  /** Native / display name */
  label: string
  /** English name for merchant UI */
  labelEn: string
  /** hreflang attribute value */
  hreflang: string
}

export const STORE_LOCALE_CATALOG: Record<StoreLocaleCode, StoreLocaleMeta> = {
  vi: { code: 'vi', label: 'Tiếng Việt', labelEn: 'Vietnamese', hreflang: 'vi' },
  en: { code: 'en', label: 'English', labelEn: 'English', hreflang: 'en' },
  de: { code: 'de', label: 'Deutsch', labelEn: 'German', hreflang: 'de' },
  fr: { code: 'fr', label: 'Français', labelEn: 'French', hreflang: 'fr' },
  es: { code: 'es', label: 'Español', labelEn: 'Spanish', hreflang: 'es' },
  pt: { code: 'pt', label: 'Português', labelEn: 'Portuguese', hreflang: 'pt' },
  it: { code: 'it', label: 'Italiano', labelEn: 'Italian', hreflang: 'it' },
  nl: { code: 'nl', label: 'Nederlands', labelEn: 'Dutch', hreflang: 'nl' },
  pl: { code: 'pl', label: 'Polski', labelEn: 'Polish', hreflang: 'pl' },
  ru: { code: 'ru', label: 'Русский', labelEn: 'Russian', hreflang: 'ru' },
  ja: { code: 'ja', label: '日本語', labelEn: 'Japanese', hreflang: 'ja' },
  ko: { code: 'ko', label: '한국어', labelEn: 'Korean', hreflang: 'ko' },
  zh: { code: 'zh', label: '中文', labelEn: 'Chinese', hreflang: 'zh' },
  th: { code: 'th', label: 'ไทย', labelEn: 'Thai', hreflang: 'th' },
  id: { code: 'id', label: 'Bahasa Indonesia', labelEn: 'Indonesian', hreflang: 'id' },
  ms: { code: 'ms', label: 'Bahasa Melayu', labelEn: 'Malay', hreflang: 'ms' },
  ar: { code: 'ar', label: 'العربية', labelEn: 'Arabic', hreflang: 'ar' },
  hi: { code: 'hi', label: 'हिन्दी', labelEn: 'Hindi', hreflang: 'hi' },
}

export function isStoreLocaleCode(value: string | null | undefined): value is StoreLocaleCode {
  return !!value && (STORE_LOCALE_CODES as readonly string[]).includes(value)
}

export function toStoreLocaleCode(value: string | null | undefined, fallback: StoreLocaleCode = 'vi'): StoreLocaleCode {
  return isStoreLocaleCode(value) ? value : fallback
}

export function storeLocaleLabel(code: StoreLocaleCode): string {
  return STORE_LOCALE_CATALOG[code].label
}

export function storeLocaleHreflang(code: StoreLocaleCode): string {
  return STORE_LOCALE_CATALOG[code].hreflang
}

/** Public path for a store page. Primary is unprefixed; secondary uses /{locale}/{slug}. */
export function buildStorePublicPath(
  slug: string,
  options: {
    locale: StoreLocaleCode
    primary: StoreLocaleCode
    kind?: 'landing' | 'order'
  },
): string {
  const kind = options.kind ?? 'landing'
  const suffix = kind === 'order' ? '/order' : ''
  const clean = slug.replace(/^\/+/, '')
  if (options.locale !== options.primary) {
    return `/${options.locale}/${clean}${suffix}`
  }
  return `/${clean}${suffix}`
}

/** Custom-domain path suffix (no slug): / , /order , /en , /en/order */
export function buildCustomDomainStorePath(
  options: {
    locale: StoreLocaleCode
    primary: StoreLocaleCode
    kind?: 'landing' | 'order'
  },
): string {
  const kind = options.kind ?? 'landing'
  const order = kind === 'order' ? '/order' : ''
  if (options.locale !== options.primary) {
    return `/${options.locale}${order}`
  }
  return order || '/'
}
