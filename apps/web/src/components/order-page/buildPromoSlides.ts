import type { OrderPromoSlide } from './promo-slides'
import type { PromoSlide } from './OrderPromoCarousel'

/** Only admin-configured slides — never auto-fill from OG / hero / menu. */
export function resolvePromoSlides(opts: {
  configured?: OrderPromoSlide[] | null
  businessName: string
}): PromoSlide[] {
  const configured = (opts.configured ?? []).filter(s => s.image_url?.trim())
  return configured.map(s => ({
    src: s.image_url,
    alt: s.alt?.trim() || opts.businessName,
  }))
}
