import type { OrderPromoSlide } from './promo-slides'
import type { PromoSlide } from './OrderPromoCarousel'
import { readLocaleText } from '@/i18n/localized-content'

/** Only admin-configured slides — never auto-fill from OG / hero / menu. */
export function resolvePromoSlides(opts: {
  configured?: OrderPromoSlide[] | null
  businessName: string
  locale?: string
  primaryLocale?: string
}): PromoSlide[] {
  const configured = (opts.configured ?? []).filter(s => s.image_url?.trim())
  const primary = opts.primaryLocale ?? 'vi'
  const locale = opts.locale || primary
  return configured.map(s => {
    const alt = readLocaleText(s.alt_i18n ?? s.alt, locale, primary)
    return {
      src: s.image_url,
      alt: alt.trim() || opts.businessName,
    }
  })
}
