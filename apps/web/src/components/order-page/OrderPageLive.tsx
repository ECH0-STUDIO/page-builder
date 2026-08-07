'use client'

/**
 * Live order page — mobile-first: carousel → horizontal categories → list menu → bottom bar.
 */

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [vegetarianOnly, setVegetarianOnly] = useState(false)
  const [spicyOnly, setSpicyOnly] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const availableTags = useMemo(() => {
    const set = new Set<string>()
    for (const item of items) {
      for (const tag of item.tags || []) {
        const trimmed = tag.trim()
        if (!trimmed) continue
        // Dietary is independent — skip migrated leftovers
        const lower = trimmed.toLowerCase()
        if (lower === 'vegetarian' || lower === 'spicy' || lower === 'vegan' || lower === 'chay' || lower === 'cay' || lower === 'thuần chay') continue
        set.add(trimmed)
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [items])

  function toggleTag(tag: string) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    )
  }

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return items.filter(item => {
      if (vegetarianOnly && !item.is_vegetarian) return false
      if (spicyOnly && !(item.spicy_level > 0)) return false
      if (selectedTags.length > 0) {
        const itemTags = item.tags || []
        if (!selectedTags.every(tag => itemTags.includes(tag))) return false
      }
      if (!q) return true
      const name = (item.name || '').toLowerCase()
      const desc = (item.description || '').toLowerCase()
      return name.includes(q) || desc.includes(q)
    })
  }, [items, searchQuery, vegetarianOnly, spicyOnly, selectedTags])

  const filterActive = Boolean(
    searchQuery.trim() || vegetarianOnly || spicyOnly || selectedTags.length > 0,
  )
  const catsForTabs = useMemo(() => {
    if (!filterActive) return visibleCats
    const ids = new Set(filteredItems.map(i => i.category_id))
    return visibleCats.filter(c => ids.has(c.id))
  }, [visibleCats, filteredItems, filterActive])

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

      <div className="sticky top-0 z-30 border-b border-black/6 bg-white/95 backdrop-blur-md">
        <div className="px-3 pt-2.5 pb-2 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('orderPage.searchMenu')}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
            <button
              type="button"
              onClick={() => setVegetarianOnly(v => !v)}
              className={cn(
                'h-8 shrink-0 px-3 rounded-full text-xs font-semibold border transition-colors',
                vegetarianOnly
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-gray-200 bg-white text-gray-600',
              )}
            >
              {t('orderPage.filterVegetarian')}
            </button>
            <button
              type="button"
              onClick={() => setSpicyOnly(v => !v)}
              className={cn(
                'h-8 shrink-0 px-3 rounded-full text-xs font-semibold border transition-colors',
                spicyOnly
                  ? 'border-orange-500 bg-orange-50 text-orange-800'
                  : 'border-gray-200 bg-white text-gray-600',
              )}
            >
              {t('orderPage.filterSpicy')}
            </button>
            {availableTags.map(tag => {
              const active = selectedTags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'h-8 shrink-0 px-3 rounded-full text-xs font-semibold border transition-colors',
                    active
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-600',
                  )}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>

        {catsForTabs.length > 0 && (
          <div className="flex gap-0 overflow-x-auto no-scrollbar px-3">
            {catsForTabs.map(cat => {
              const active = (activeCategoryId ?? catsForTabs[0]?.id) === cat.id
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
        )}
      </div>

      <main id="order-menu" className="flex-1 px-3 py-3 pb-28 scroll-mt-14">
        {filteredItems.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-500">{t('orderPage.noMenuMatches')}</p>
        ) : (
          <MenuGridRender
            config={orderMenuConfig}
            data={{
              categories,
              items: filteredItems,
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
        )}
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
