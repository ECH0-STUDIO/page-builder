import type { PageBlock, HeroConfig } from '@/components/page-builder/types'
import type { MenuItem } from '@/app/actions/menu'
import type { PromoSlide } from './OrderPromoCarousel'

/** Collect promo images for the order-page carousel (Phase 1 — no dedicated admin yet). */
export function buildPromoSlides(opts: {
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
