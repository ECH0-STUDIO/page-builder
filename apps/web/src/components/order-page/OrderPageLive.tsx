'use client'

/**
 * Live order page — mobile-first: carousel → horizontal categories → list menu → bottom bar.
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
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/I18nProvider'

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
  /** False outside opening hours — browse only, no checkout */
  orderingOpen?: boolean
  /** Optional "08:00 – 22:00" for closed banner */
  todayHoursLabel?: string | null
}

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
  orderingOpen = true,
  todayHoursLabel = null,
}: OrderPageLiveProps) {
  const { t } = useTranslation()
  const visibleCats = useMemo(
    () => categories.filter(c => c.visible),
    [categories],
  )
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    () => visibleCats[0]?.id ?? null,
  )

  // Order page is always a mobile list — ignore landing-style grid layouts.
  // No section title/description (carousel + category tabs cover that).
  const orderMenuConfig: MenuGridConfig = {
    ...menuConfig,
    layout: 'list',
    show_category_tabs: false,
    tabs_layout: 'horizontal',
    heading: '',
    description: '',
  }

  function selectCategory(id: string) {
    setActiveCategoryId(id)
    window.setTimeout(() => {
      document.getElementById('order-menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  return (
    <>
      <OrderPromoCarousel
        slides={promoSlides}
        businessName={businessName}
        brandColor={brandColor}
        aspectDesktop={aspectDesktop}
        aspectMobile={aspectMobile}
        forceAspect={aspectMobile === 'same' ? aspectDesktop : aspectMobile}
      />

      {!orderingOpen && (
        <div className="mx-3 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-950">
          <p className="font-semibold">{t('orderPage.closedBanner')}</p>
          <p className="mt-0.5 text-amber-900/80 text-xs leading-relaxed">
            {todayHoursLabel
              ? t('orderPage.closedBannerHours').replace('{{hours}}', todayHoursLabel)
              : t('orderPage.closedBannerHint')}
          </p>
        </div>
      )}

      {visibleCats.length > 0 && (
        <div className="sticky top-0 z-30 border-b border-black/6 bg-white/95 backdrop-blur-md">
          <div className="flex gap-0 overflow-x-auto no-scrollbar px-3">
            {visibleCats.map(cat => {
              const active = (activeCategoryId ?? visibleCats[0]?.id) === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => selectCategory(cat.id)}
                  className={cn(
                    'shrink-0 rounded-none bg-transparent px-3.5 py-2.5 text-sm transition-colors border-b-2 -mb-px',
                    active ? 'font-semibold' : 'font-medium text-gray-500 hover:text-gray-800',
                  )}
                  style={{
                    color: active ? brandColor : undefined,
                    borderColor: active ? brandColor : 'transparent',
                  }}
                >
                  {cat.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <main id="order-menu" className="flex-1 px-3 py-3 pb-28 scroll-mt-14">
        <MenuGridRender
          config={orderMenuConfig}
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
          previewLayout="mobile"
          browseOnly={!orderingOpen}
        />
      </main>

      <OrderBottomBar
        businessId={businessId}
        brandColor={brandColor}
        orderingOpen={orderingOpen}
      />

      <OrderScrollTop brandColor={brandColor} />

      <LiveStoreCart
        businessId={businessId}
        paymentSettings={paymentSettings}
        locale={locale}
        brandColor={brandColor}
        hideFab
        orderingOpen={orderingOpen}
      />
    </>
  )
}
