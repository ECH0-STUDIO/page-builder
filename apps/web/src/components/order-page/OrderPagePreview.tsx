'use client'

/**
 * Live canvas preview for the Order Page builder — always mobile-width, list menu.
 */

import Image from 'next/image'
import { OrderPromoCarousel } from '@/components/order-page/OrderPromoCarousel'
import type { PromoSlide } from '@/components/order-page/OrderPromoCarousel'
import type { CarouselAspect, CarouselAspectMobile } from '@/components/order-page/promo-slides'
import { MenuGridRender } from '@/components/page-builder/render/MenuGridRender'
import { CartProvider } from '@/components/page-builder/render/CartContext'
import type { MenuGridConfig } from '@/components/page-builder/types'
import type { MenuCategory, MenuItem } from '@/app/actions/menu'
import { cn } from '@/lib/utils'

interface OrderPagePreviewProps {
  businessName: string
  logoUrl?: string | null
  brandColor: string
  bgColor: string
  bgImage: string
  headingFont?: string
  bodyFont?: string
  slides: PromoSlide[]
  aspectDesktop: CarouselAspect
  aspectMobile: CarouselAspectMobile
  menuConfig: MenuGridConfig
  categories: MenuCategory[]
  items: MenuItem[]
  slug: string
}

export function OrderPagePreview({
  businessName,
  logoUrl,
  brandColor,
  bgColor,
  bgImage,
  headingFont = 'Inter',
  bodyFont = 'Inter',
  slides,
  aspectDesktop,
  aspectMobile,
  menuConfig,
  categories,
  items,
  slug,
}: OrderPagePreviewProps) {
  const fontsToLoad = [...new Set([headingFont, bodyFont].filter(f => f && f !== 'Inter'))]
  const googleFontUrl = fontsToLoad.length > 0
    ? `https://fonts.googleapis.com/css2?${fontsToLoad.map(f => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700;800`).join('&')}&display=swap`
    : null

  const visibleCats = categories.filter(c => c.visible)
  const orderMenuConfig: MenuGridConfig = {
    ...menuConfig,
    layout: 'list',
    show_category_tabs: false,
  }
  const forceAspect = aspectMobile === 'same' ? aspectDesktop : aspectMobile

  return (
    <div
      className={cn(
        'mx-auto bg-white shadow-2xl overflow-hidden max-w-[390px] rounded-[1.75rem] ring-4 ring-black/5',
      )}
    >
      {googleFontUrl && <link rel="stylesheet" href={googleFontUrl} />}
      <div
        className="min-h-[640px] flex flex-col"
        style={
          bgImage
            ? {
                backgroundImage: `linear-gradient(rgba(243,244,246,0.85), rgba(243,244,246,0.85)), url(${bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                fontFamily: `'${bodyFont}', sans-serif`,
              }
            : {
                backgroundColor: '#f3f4f6',
                fontFamily: `'${bodyFont}', sans-serif`,
              }
        }
      >
        <style>{`
          .order-preview-canvas h1, .order-preview-canvas h2, .order-preview-canvas h3 {
            font-family: '${headingFont}', sans-serif !important;
          }
        `}</style>
        <div
          className="order-preview-canvas flex-1 flex flex-col shadow-sm"
          style={{ backgroundColor: bgColor || '#ffffff' }}
        >
          <div className="flex h-12 items-center justify-center gap-2 border-b border-black/6 px-3 bg-white">
            {logoUrl ? (
              <div className="relative size-7 shrink-0 overflow-hidden rounded-full bg-gray-100">
                <Image src={logoUrl} alt="" fill className="object-cover" sizes="28px" />
              </div>
            ) : (
              <div
                className="size-7 shrink-0 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: brandColor }}
              >
                {businessName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="truncate text-xs font-semibold text-gray-900">{businessName}</span>
          </div>

          <OrderPromoCarousel
            slides={slides}
            businessName={businessName}
            brandColor={brandColor}
            aspectDesktop={aspectDesktop}
            aspectMobile={aspectMobile}
            forceAspect={forceAspect}
            showEmptyHint
          />

          {visibleCats.length > 0 && (
            <div className="border-b border-black/6 bg-white">
              <div className="flex gap-2 overflow-x-auto no-scrollbar px-3 py-2">
                {visibleCats.map((cat, i) => (
                  <span
                    key={cat.id}
                    className={cn(
                      'shrink-0 rounded-full px-3 py-1 text-xs font-semibold',
                      i === 0 ? 'text-white' : 'bg-gray-100 text-gray-600',
                    )}
                    style={i === 0 ? { backgroundColor: brandColor } : undefined}
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <CartProvider>
            <div className="flex-1 pointer-events-none select-none px-3 py-3">
              <MenuGridRender
                config={orderMenuConfig}
                data={{
                  categories,
                  items,
                  variantGroups: [],
                  variantOptions: [],
                  businessSlug: slug,
                }}
                brandColor={brandColor}
                previewLayout="mobile"
                hideCategoryTabs
              />
            </div>
          </CartProvider>

          {/* Static bottom bar chrome */}
          <div className="mt-auto border-t border-black/6 bg-white px-3 py-2.5 flex gap-2">
            <div className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-xs text-gray-500">
              …
            </div>
            <div
              className="shrink-0 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white"
              style={{ backgroundColor: brandColor }}
            >
              …
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
