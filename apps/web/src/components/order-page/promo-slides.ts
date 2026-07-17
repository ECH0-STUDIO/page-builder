/**
 * Order-page promo carousel slide model.
 * Stored as jsonb on publishing_settings.order_promo_slides.
 */

export interface OrderPromoSlide {
  id: string
  image_url: string
  /** Optional caption / alt text shown for accessibility */
  alt: string
}

export const MAX_ORDER_PROMO_SLIDES = 8

export function normalizeOrderPromoSlides(raw: unknown): OrderPromoSlide[] {
  if (!Array.isArray(raw)) return []
  const slides: OrderPromoSlide[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const image_url = typeof row.image_url === 'string' ? row.image_url.trim() : ''
    if (!image_url) continue
    slides.push({
      id: typeof row.id === 'string' && row.id ? row.id : cryptoRandomId(),
      image_url,
      alt: typeof row.alt === 'string' ? row.alt : '',
    })
    if (slides.length >= MAX_ORDER_PROMO_SLIDES) break
  }
  return slides
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `slide-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
