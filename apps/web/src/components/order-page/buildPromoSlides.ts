import type { PageBlock, HeroConfig } from '@/components/page-builder/types'
import type { MenuItem } from '@/app/actions/menu'
import type { PromoSlide } from './OrderPromoCarousel'
import type { OrderPromoSlide } from './promo-slides'

/** Prefer admin-configured slides; otherwise derive from OG / hero / menu images. */
export function resolvePromoSlides(opts: {
  configured?: OrderPromoSlide[] | null
  businessName: string
  ogImageUrl?: string | null
  pageBlocks: PageBlock[]
  menuItems: MenuItem[]
}): PromoSlide[] {
  const configured = (opts.configured ?? []).filter(s => s.image_url?.trim())
  if (configured.length > 0) {
    return configured.map(s => ({
      src: s.image_url,
      alt: s.alt?.trim() || opts.businessName,
    }))
  }
  return buildAutoPromoSlides(opts)
}

/** Auto-collect promo images when no admin slides are configured. */
export function buildAutoPromoSlides(opts: {
  businessName: string
  ogImageUrl?: string | null
  pageBlocks: PageBlock[]
  menuItems: MenuItem[]
}): PromoSlide[] {
  const seen = new Set<string>()
  const slides: PromoSlide[] = []

  function push(src: string | null | undefined, alt: string) {
    const url = (src ?? '').trim()
    if (!url || seen.has(url)) return
    seen.add(url)
    slides.push({ src: url, alt })
  }

  push(opts.ogImageUrl, opts.businessName)

  for (const block of opts.pageBlocks) {
    if (block.type !== 'hero') continue
    const cfg = block.config as HeroConfig
    push(cfg.image_url, cfg.heading || opts.businessName)
  }

  const featured = opts.menuItems
    .filter(i => i.available && i.image_url)
    .slice(0, 6)

  for (const item of featured) {
    push(item.image_url, item.name)
  }

  return slides.slice(0, 8)
}

/** @deprecated Use resolvePromoSlides */
export const buildPromoSlides = buildAutoPromoSlides
