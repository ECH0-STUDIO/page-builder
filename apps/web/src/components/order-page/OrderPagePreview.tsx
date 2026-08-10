'use client'

/**
 * Live canvas preview for the Order Page builder — always mobile-width, list menu.
 * Uses the real OrderBottomBar (and cart in preview mode) so chrome matches live.
 */

import { Suspense, useMemo, useState } from 'react'
import Image from 'next/image'
import { Star } from 'lucide-react'
import { OrderPromoCarousel } from '@/components/order-page/OrderPromoCarousel'
import type { PromoSlide } from '@/components/order-page/OrderPromoCarousel'
import type { CarouselAspect, CarouselAspectMobile } from '@/components/order-page/promo-slides'
import { OrderBottomBar } from '@/components/order-page/OrderBottomBar'
import { MenuGridRender, MenuItemModal } from '@/components/page-builder/render/MenuGridRender'
import { CartProvider } from '@/components/page-builder/render/CartContext'
import { LiveStoreCart } from '@/components/page-builder/render/LiveStoreCart'
import type { MenuGridConfig } from '@/components/page-builder/types'
import type { MenuCategory, MenuItem, VariantGroup, VariantOption } from '@/app/actions/menu'
import type { PaymentSettings } from '@/lib/vietqr-utils'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/I18nProvider'
import { formatCurrency } from '@/lib/currency'

interface OrderPagePreviewProps {
  businessId: string
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
  variantGroups?: VariantGroup[]
  variantOptions?: VariantOption[]
  slug: string
  paymentSettings?: PaymentSettings | null
  locale?: string
  /** Interactive preview — add to cart, open cart drawer, try bottom bar */
  previewMode?: boolean
}

export function OrderPagePreview({
  businessId,
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
  variantGroups = [],
  variantOptions = [],
  slug,
  paymentSettings = {},
  locale,
  previewMode = false,
}: OrderPagePreviewProps) {
  const { t } = useTranslation()
  const fontsToLoad = [...new Set([headingFont, bodyFont].filter(f => f && f !== 'Inter'))]
  const googleFontUrl = fontsToLoad.length > 0
    ? `https://fonts.googleapis.com/css2?${fontsToLoad.map(f => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700;800`).join('&')}&display=swap`
    : null

  const visibleCats = useMemo(
    () => categories.filter(c => c.visible),
    [categories],
  )
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    () => visibleCats[0]?.id ?? null,
  )
  const [featuredModalItem, setFeaturedModalItem] = useState<MenuItem | null>(null)
  const featuredItems = useMemo(
    () => items.filter(i => i.is_featured),
    [items],
  )

  const orderMenuConfig: MenuGridConfig = {
    ...menuConfig,
    layout: 'list',
    show_category_tabs: false,
    heading: '',
    description: '',
  }
  const forceAspect = aspectMobile === 'same' ? aspectDesktop : aspectMobile

  function selectCategory(id: string) {
    if (!previewMode) return
    setActiveCategoryId(id)
  }

  return (
    <div
      className={cn(
        'mx-auto bg-white shadow-2xl overflow-hidden max-w-[390px] rounded-[1.75rem] ring-4 ring-black/5',
        'relative',
      )}
    >
      {googleFontUrl && <link rel="stylesheet" href={googleFontUrl} />}
      <div
        className="min-h-[640px] flex flex-col relative"
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
        <CartProvider>
          <div
            className="order-preview-canvas flex-1 flex flex-col shadow-sm relative min-h-[640px]"
            style={{ backgroundColor: bgColor || '#ffffff' }}
          >
            <div className="flex h-12 items-center justify-center gap-2 border-b border-black/6 px-3 bg-white shrink-0 z-10">
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

            <div
              className={cn(
                'flex-1 min-h-0 overflow-y-auto',
                !previewMode && 'pointer-events-none select-none',
              )}
            >
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
                <div className="sticky top-0 z-20 border-b border-black/6 bg-white/95 backdrop-blur-md">
                  <div className="flex gap-0 overflow-x-auto no-scrollbar px-3">
                    {visibleCats.map(cat => {
                      const active = (activeCategoryId ?? visibleCats[0]?.id) === cat.id
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => selectCategory(cat.id)}
                          className={cn(
                            'shrink-0 rounded-none bg-transparent px-3 py-2 text-xs transition-colors border-b-2 -mb-px',
                            active ? 'font-semibold' : 'font-medium text-gray-500',
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

              <div className="px-3 py-3 pb-28">
                {featuredItems.length > 0 && (
                  <section className="mb-3" aria-label={t('orderPage.featured')}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Star className="size-3 text-neutral-900 fill-neutral-900" aria-hidden />
                      <h2 className="text-xs font-semibold text-neutral-900">
                        {t('orderPage.featured')}
                      </h2>
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                      {featuredItems.map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => previewMode && setFeaturedModalItem(item)}
                          className="shrink-0 w-[7.5rem] text-left rounded-2xl border border-neutral-200 bg-white overflow-hidden"
                        >
                          <div className="aspect-[4/3] bg-neutral-100 relative">
                            {item.image_url ? (
                              <Image src={item.image_url} alt="" fill className="object-cover" sizes="120px" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-300 text-xl font-light">
                                {item.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-medium text-neutral-900 line-clamp-2 leading-snug">{item.name}</p>
                            <p className="text-xs font-semibold text-neutral-800 mt-0.5 tabular-nums">
                              {formatCurrency(item.price)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}
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
                  previewLayout="mobile"
                  hideCategoryTabs
                  activeCategoryId={activeCategoryId}
                  onActiveCategoryChange={previewMode ? setActiveCategoryId : undefined}
                  browseOnly={!previewMode}
                />
              </div>

              {featuredModalItem && previewMode && (
                <MenuItemModal
                  item={featuredModalItem}
                  groups={variantGroups}
                  options={variantOptions}
                  config={orderMenuConfig}
                  brandColor={brandColor}
                  onClose={() => setFeaturedModalItem(null)}
                  browseOnly={false}
                />
              )}
            </div>

            <Suspense
              fallback={
                <div className="absolute bottom-0 inset-x-0 z-40 border-t border-black/6 bg-white px-3 py-2.5 flex gap-2">
                  <div className="flex-1 h-12 rounded-xl border border-gray-200" />
                  <div className="w-12 h-12 rounded-xl border border-gray-200" />
                </div>
              }
            >
              <div className={cn(!previewMode && 'pointer-events-none')}>
                <OrderBottomBar
                  businessId={businessId}
                  brandColor={brandColor}
                  contained
                  previewMode
                />
              </div>
            </Suspense>

            {previewMode && (
              <LiveStoreCart
                businessId={businessId}
                paymentSettings={paymentSettings ?? {}}
                locale={locale}
                brandColor={brandColor}
                contained
                previewMode
                hideFab
              />
            )}
          </div>
        </CartProvider>
      </div>
    </div>
  )
}
