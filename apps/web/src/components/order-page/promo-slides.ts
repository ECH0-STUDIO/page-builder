/**
 * Order-page promo carousel slide + aspect ratio helpers.
 */

export interface OrderPromoSlide {
  id: string
  image_url: string
  /** Optional caption / alt text shown for accessibility */
  alt: string
  /** Localized alt map written by Translation UI */
  alt_i18n?: import('@/i18n/localized-content').LocalizedString
}

export const MAX_ORDER_PROMO_SLIDES = 8

export type CarouselAspect = '16/9' | '21/9' | '4/3' | '1/1'
export type CarouselAspectMobile = CarouselAspect | 'same'

export const CAROUSEL_ASPECTS: CarouselAspect[] = ['16/9', '21/9', '4/3', '1/1']

/** Suggested upload size (px) for each aspect — shown as guidance in admin. */
export const CAROUSEL_ASPECT_GUIDE: Record<CarouselAspect, { label: string; px: string }> = {
  '16/9': { label: '16:9', px: '1920×1080' },
  '21/9': { label: '21:9', px: '1920×823' },
  '4/3': { label: '4:3', px: '1600×1200' },
  '1/1': { label: '1:1', px: '1080×1080' },
}

export function normalizeCarouselAspect(raw: unknown, fallback: CarouselAspect = '16/9'): CarouselAspect {
  if (raw === '16/9' || raw === '21/9' || raw === '4/3' || raw === '1/1') return raw
  return fallback
}

export function normalizeCarouselAspectMobile(raw: unknown): CarouselAspectMobile {
  if (raw === 'same') return 'same'
  return normalizeCarouselAspect(raw, '16/9')
}

/** Tailwind-friendly aspect class for a ratio string like "16/9". */
export function aspectClass(ratio: CarouselAspect): string {
  switch (ratio) {
    case '21/9': return 'aspect-[21/9]'
    case '4/3': return 'aspect-[4/3]'
    case '1/1': return 'aspect-square'
    default: return 'aspect-video' // 16/9
  }
}

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
      ...(row.alt_i18n != null ? { alt_i18n: row.alt_i18n as OrderPromoSlide['alt_i18n'] } : {}),
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
