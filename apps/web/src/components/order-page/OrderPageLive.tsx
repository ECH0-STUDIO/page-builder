'use client'

/**
 * Client shell for the live order page — category drawer state + scroll-to-top.
 */

import { useMemo, useState } from 'react'
import { OrderPromoCarousel } from '@/components/order-page/OrderPromoCarousel'
import { OrderBottomBar } from '@/components/order-page/OrderBottomBar'
import { OrderScrollTop } from '@/components/order-page/OrderScrollTop'
import { MenuGridRender } from '@/components/page-builder/render/MenuGridRender'
import { LiveStoreCart } from '@/components/page-builder/render/LiveStoreCart'
import type { MenuGridConfig } from '@/components/page-builder/types'
import type { MenuCategory, MenuItem, VariantGroup, VariantOption } from '@/app/actions/menu'
import type { PaymentSettings } from '@/lib/vietqr-utils'
import type { PromoSlide } from '@/components/order-page/OrderPromoCarousel'
import type { CarouselAspect, CarouselAspectMobile } from '@/components/order-page/promo-slides'

interface OrderPageLiveProps {
  businessId: string
  businessName: string
  brandColor: string
  promoSlides: PromoSlide[]
  aspectDesktop: CarouselAspect
  aspectMobile: CarouselAspectMobile
  menuConfig: MenuGridConfig
  categories: MenuCategory[]
  items: MenuItem[]
  variantGroups: VariantGroup[]
  variantOptions: VariantOption[]
  slug: string
  paymentSettings: PaymentSettings
  locale: string
}

// Client shell for live order page content
export function OrderPageLive({
  businessId,
  businessName,
  brandColor,
  promoSlides,
  aspectDesktop,
  aspectMobile,
  menuConfig,
  categories,
  items,
  variantGroups,
  variantOptions,
  slug,
  paymentSettings,
  locale,
}: OrderPageLiveProps) {
  const visibleCats = useMemo(
    () => categories.filter(c => c.visible),
    [categories],
  )
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    () => visibleCats[0]?.id ?? null,
  )

  return (
    <>
      <OrderPromoCarousel
        slides={promoSlides}
        businessName={businessName}
        brandColor={brandColor}
        aspectDesktop={aspectDesktop}
        aspectMobile={aspectMobile}
      />

      <main id="order-menu" className="flex-1 px-4 sm:px-6 py-6 pb-36 scroll-mt-4">
        <MenuGridRender
          config={menuConfig}
          data={{
            categories,
            items,
            variantGroups,
            variantOptions,
            businessSlug: slug,
          }}
          brandColor={brandColor}
          hideCategoryTabs
          activeCategoryId={activeCategoryId}
          onActiveCategoryChange={setActiveCategoryId}
        />
      </main>

      <OrderBottomBar
        businessId={businessId}
        brandColor={brandColor}
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelectCategory={setActiveCategoryId}
      />

      <OrderScrollTop brandColor={brandColor} />

      <LiveStoreCart
        businessId={businessId}
        paymentSettings={paymentSettings}
        locale={locale}
        fabOffsetClass="bottom-24"
      />
    </>
  )
}
