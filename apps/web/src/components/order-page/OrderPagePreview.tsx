'use client'

/**
 * Live canvas preview for the stripped-down Order Page builder.
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

export type PreviewDevice = 'desktop' | 'mobile'

interface OrderPagePreviewProps {
  device: PreviewDevice
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
  device,
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
  const isMobile = device === 'mobile'
  const fontsToLoad = [...new Set([headingFont, bodyFont].filter(f => f && f !== 'Inter'))]
  const googleFontUrl = fontsToLoad.length > 0
    ? `https://fonts.googleapis.com/css2?${fontsToLoad.map(f => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700;800`).join('&')}&display=swap`
    : null

  return (
    <div
      className={cn(
        'mx-auto bg-white shadow-2xl overflow-hidden transition-[max-width] duration-300',
        isMobile ? 'max-w-[390px] rounded-[1.75rem] ring-4 ring-black/5' : 'max-w-[960px] rounded-xl',
      )}
    >
      {googleFontUrl && <link rel="stylesheet" href={googleFontUrl} />}
      <div
        className="min-h-[520px] flex flex-col"
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
          {/* Static header chrome — logo + name only */}
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
            forceAspect={
              isMobile
                ? (aspectMobile === 'same' ? aspectDesktop : aspectMobile)
                : aspectDesktop
            }
            showEmptyHint
          />

          <CartProvider>
            <div className="flex-1 pointer-events-none select-none px-4 py-5">
              <MenuGridRender
                config={menuConfig}
                data={{
                  categories,
                  items,
                  variantGroups: [],
                  variantOptions: [],
                  businessSlug: slug,
                }}
                brandColor={brandColor}
                previewLayout={isMobile ? 'mobile' : 'desktop'}
              />
            </div>
          </CartProvider>
        </div>
      </div>
    </div>
  )
}
