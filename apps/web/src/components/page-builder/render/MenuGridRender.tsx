'use client'

/**
 * MenuGridRender — shared between editor canvas and live page.
 *
 * Wraps itself in CartProvider so the cart is scoped to this menu section.
 * When item_click === 'modal', the ItemModal lets customers:
 *  1. View item details (image, description, price)
 *  2. Select variants (required groups must be selected)
 *  3. See live-updating total as they pick options
 *  4. Add the configured item to the cart
 *
 * CartDrawer (floating button + bottom sheet + call waiter) is rendered
 * as a sibling so it sits outside the scrollable content.
 */

import { useEffect, useRef, useState, useMemo } from 'react'
import Image from 'next/image'
import { ShoppingBag, ChevronDown, Check, Info, Plus, X, AlertCircle } from 'lucide-react'
import { useTranslation } from '@/i18n/I18nProvider'
import { plainText } from '@/i18n/locale'
import { formatCurrency, formatPriceDelta } from '@/lib/currency'
import type { MenuGridConfig } from '../types'
import type { MenuCategory, MenuItem, VariantGroup, VariantOption } from '@/app/actions/menu'
import { useCart, type CartVariantSelection } from './CartContext'
import { getTypography } from './typography'
import { cn } from '@/lib/utils'
import {
  type PreviewLayout,
  isForcedMobileLayout,
  menuGridColClass,
  sectionPaddingClass,
} from './preview-layout'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface MenuGridData {
  categories: MenuCategory[]
  items: MenuItem[]
  variantGroups: VariantGroup[]
  variantOptions: VariantOption[]
  businessSlug?: string
}

// ─── Item Modal (with cart integration) ──────────────────────────────────────

function ItemModal({
  item, groups, options, config, onClose,
}: {
  item: MenuItem
  groups: VariantGroup[]
  options: VariantOption[]
  config: MenuGridConfig
  onClose: () => void
}) {
  const { addItem } = useCart()
  const { t } = useTranslation()

  const itemGroups = groups
    .filter(g => g.item_id === item.id)
    .sort((a, b) => a.sort_order - b.sort_order)

  // selected[groupId] = array of optionId
  const [selected, setSelected] = useState<Record<string, string[]>>({})
  const [attempted, setAttempted] = useState(false)
  const [added, setAdded] = useState(false)

  // Required validation
  const requiredGroups = itemGroups.filter(g => g.required)
  const allRequiredFilled = requiredGroups.every(g => selected[g.id] && selected[g.id].length > 0)

  // Live running total
  const variantDelta = Object.values(selected).flat().reduce((sum, optId) => {
    const opt = options.find(o => o.id === optId)
    return sum + (opt?.price_delta ?? 0)
  }, 0)
  const runningTotal = item.price + variantDelta

  function handleAdd() {
    if (!allRequiredFilled) {
      setAttempted(true)
      return
    }
    const variants: CartVariantSelection[] = Object.entries(selected).flatMap(([groupId, optIds]) => {
      const group = itemGroups.find(g => g.id === groupId)!
      return optIds.map(optId => {
        const opt = options.find(o => o.id === optId)!
        return {
          groupId,
          groupName: group.name,
          optionId: optId,
          optionLabel: opt.label,
          priceDelta: opt.price_delta,
        }
      })
    })
    addItem(item, variants)
    setAdded(true)
    setTimeout(() => { onClose() }, 700)
  }

  const hasGroups = itemGroups.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 size-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
        >
          <X className="size-4" />
        </button>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {config.show_image && item.image_url && (
            <div className="aspect-video w-full overflow-hidden bg-gray-100 shrink-0 relative">
              <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
          )}

          <div className={cn("p-5 space-y-5", !(config.show_image && item.image_url) && "pt-10")}>
            {/* Title + availability */}
            <div>
              <div className="flex items-start justify-between gap-3 pr-8">
                <h3 className="text-xl font-bold leading-tight text-gray-900">{item.name}</h3>
                {!item.available && (
                  <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium mt-1">
                    {t('cart.soldOut')}
                  </span>
                )}
              </div>
              {config.show_description && item.description && (
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{item.description}</p>
              )}
              {/* Tags */}
              {(item.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(item.tags || []).map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Variant groups */}
            {itemGroups.map(group => {
              const groupOpts = options
                .filter(o => o.group_id === group.id)
                .sort((a, b) => a.sort_order - b.sort_order)
              const hasError = attempted && group.required && (!selected[group.id] || selected[group.id].length === 0)

              return (
                <div key={group.id} className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900">{group.name}</p>
                    {group.required
                      ? <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-900 text-white font-semibold uppercase tracking-wide">{t('cart.required')}</span>
                      : <span className="text-[10px] text-gray-400">{t('cart.optional')}</span>
                    }
                  </div>

                  {hasError && (
                    <div className="flex items-center gap-1.5 text-red-500 text-xs">
                      <AlertCircle className="size-3 shrink-0" />
                      <span>{t('cart.pleaseSelect')}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {groupOpts.map(opt => {
                      const isSelected = selected[group.id]?.includes(opt.id)

                      const toggleSelection = () => {
                        setSelected(prev => {
                          const current = prev[group.id] || []
                          if (group.allow_multiple) {
                            if (current.includes(opt.id)) {
                              return { ...prev, [group.id]: current.filter(id => id !== opt.id) }
                            } else {
                              return { ...prev, [group.id]: [...current, opt.id] }
                            }
                          } else {
                            // single choice
                            return { ...prev, [group.id]: [opt.id] }
                          }
                        })
                      }

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={toggleSelection}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm border-2 transition-all ${
                            isSelected
                              ? 'border-gray-900 bg-gray-900 text-white font-semibold'
                              : hasError
                                ? 'border-red-200 bg-red-50 text-gray-700 hover:border-gray-300'
                                : 'border-gray-200 text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          {isSelected && <Check className="size-3 shrink-0" strokeWidth={3} />}
                          <span>{opt.label}</span>
                          {opt.price_delta !== 0 && (
                            <span className={`text-xs ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                              {formatPriceDelta(opt.price_delta)}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sticky footer — price + add to order */}
        <div className="px-5 pb-8 pt-4 border-t border-gray-100 bg-white space-y-3 shrink-0">
          {config.show_price && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{hasGroups ? t('cart.currentTotal') : t('cart.price')}</span>
              <span className="text-lg font-bold text-gray-900 tabular-nums transition-all">
                {formatCurrency(runningTotal)}
              </span>
            </div>
          )}

          {item.available ? (
            <button
              onClick={handleAdd}
              disabled={added}
              className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                added
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/20'
              }`}
            >
              {added ? (
                <><Check className="size-5" strokeWidth={3} />{t('cart.addedToOrder')}</>
              ) : (
                <><Plus className="size-5" />{t('cart.addToOrder')}</>
              )}
            </button>
          ) : (
            <div className="w-full py-4 rounded-2xl bg-gray-100 text-gray-400 font-semibold text-base text-center">
              {t('cart.currentlyUnavailable')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Item Card (grid layout) ───────────────────────────────────────────────────

function ItemCardGrid({
  item, config, onClick, onQuickAdd, hasVariants, optionCount
}: {
  item: MenuItem
  config: MenuGridConfig
  onClick: () => void
  onQuickAdd: () => void
  hasVariants: boolean
  optionCount: number
}) {
  const { t } = useTranslation()
  const textColor = config.text_color || '#111111'
  const sectionBg = config.background_color || '#ffffff'
  const cardBg = '#ffffff'

  function handleAddClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (hasVariants) {
      onClick()
    } else {
      onQuickAdd()
    }
  }

  return (
    <div
      onClick={onClick}
      className={`group rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer`}
      style={{ backgroundColor: cardBg }}
      id={`item-${item.id}`}
    >
      {config.show_image && (
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          {item.image_url
            ? <Image src={item.image_url} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 50vw, 33vw" />
            : <div className="w-full h-full flex items-center justify-center text-2xl text-gray-200">🍽️</div>
          }
          {!item.available && config.show_unavailable_badge && (
            <span className="absolute bottom-2 right-2 text-[11px] px-2 py-0.5 rounded-full bg-black/60 text-white font-medium backdrop-blur-sm">
              {t('cart.soldOut')}
            </span>
          )}
          {(item.tags || []).includes('Bestseller') && (
            <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-amber-900 font-semibold shadow-sm">
              ⭐ Bestseller
            </span>
          )}
        </div>
      )}
      <div className="p-3">
        <p className="font-semibold text-sm leading-snug line-clamp-1" style={{ color: textColor }}>{item.name}</p>
        {config.show_description && item.description && (
          <p className="text-xs mt-0.5 line-clamp-2 leading-relaxed" style={{ color: textColor, opacity: 0.6 }}>{item.description}</p>
        )}
        <div className="flex flex-col mt-2">
          {hasVariants && optionCount > 0 && (
            <span className="text-[10px] font-semibold tracking-wider text-amber-600 mb-1.5 uppercase">
              {optionCount} {optionCount === 1 ? t('cart.option') : t('cart.options')} {t('cart.availableLabel')}
            </span>
          )}
          <div className="flex items-center justify-between">
            {config.show_price ? (
              <p className="text-sm font-bold" style={{ color: textColor }}>{formatCurrency(item.price)}</p>
            ) : <div />}
            <button type="button" onClick={handleAddClick} className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 hover:scale-105 transition-transform" style={{ backgroundColor: textColor, color: sectionBg }}>
              <Plus className="size-4 pointer-events-none" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Item Row (list layout) ──────────────────────────────────────────────────

function ItemRowList({
  item, config, onClick, onQuickAdd, hasVariants, optionCount
}: {
  item: MenuItem
  config: MenuGridConfig
  onClick: () => void
  onQuickAdd: () => void
  hasVariants: boolean
  optionCount: number
}) {
  const { t } = useTranslation()
  const textColor = config.text_color || '#111111'
  const sectionBg = config.background_color || '#ffffff'
  const cardBg = '#ffffff'

  function handleAddClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (hasVariants) {
      onClick()
    } else {
      onQuickAdd()
    }
  }

  return (
    <div
      onClick={onClick}
      className={`flex gap-4 items-center py-4 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 -mx-4 px-4 rounded-lg transition-colors`}
      id={`item-${item.id}`}
    >
      {config.show_image && (
        <div className="size-16 rounded-lg bg-gray-100 overflow-hidden shrink-0 relative">
          {item.image_url
            ? <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="64px" />
            : <div className="w-full h-full flex items-center justify-center text-xl text-gray-200">🍽️</div>
          }
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm" style={{ color: textColor }}>{item.name}</p>
          {!item.available && config.show_unavailable_badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium shrink-0">{t('cart.soldOut')}</span>
          )}
        </div>
        {config.show_description && item.description && (
          <p className="text-xs mt-0.5 line-clamp-1" style={{ color: textColor, opacity: 0.6 }}>{item.description}</p>
        )}
        {hasVariants && optionCount > 0 && (
          <p className="text-[10px] mt-1 font-semibold text-amber-600 uppercase tracking-wider">
            {optionCount} {optionCount === 1 ? t('cart.option') : t('cart.options')} {t('cart.availableLabel')}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 ml-2">
        {config.show_price && (
          <p className="text-sm font-bold shrink-0" style={{ color: textColor }}>{formatCurrency(item.price)}</p>
        )}
        <button type="button" onClick={handleAddClick} className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 hover:scale-105 transition-transform" style={{ backgroundColor: textColor, color: sectionBg }}>
          <Plus className="size-4 pointer-events-none" />
        </button>
      </div>
    </div>
  )
}

// ─── Inner render (needs CartProvider as ancestor) ────────────────────────────

function MenuGridInner({
  config,
  data,
  previewLayout,
  isMobilePreview,
}: MenuGridRenderProps & { previewLayout?: PreviewLayout; isMobilePreview?: boolean }) {
  const sectionHeading = plainText(config.heading)
  const sectionDescription = plainText(config.description)
  const layout: PreviewLayout | undefined =
    previewLayout ?? (isMobilePreview ? 'mobile' : 'responsive')
  const mobileLayout = isForcedMobileLayout(layout)
  const desktopLayout = layout === 'desktop'

  const { t } = useTranslation()
  const { categories, items, variantGroups, variantOptions } = data
  const { addItem } = useCart()
  const [activeCatId, setActiveCatId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const loadingTimer = useRef<NodeJS.Timeout | null>(null)
  const renderTimer = useRef<NodeJS.Timeout | null>(null)
  const [modalItem, setModalItem] = useState<MenuItem | null>(null)

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (loadingTimer.current) clearTimeout(loadingTimer.current)
      if (renderTimer.current) clearTimeout(renderTimer.current)
    }
  }, [])

  const sectionBg = config.background_color || '#ffffff'
  const textColor = config.text_color || '#111111'

  const typography = getTypography(mobileLayout)

  const isCustomMode = config.selection_mode === 'custom_items'

  const visibleCats = isCustomMode 
    ? [] 
    : categories.filter(c => c.visible && (
        config.category_ids.length === 0 || config.category_ids.includes(c.id)
      ))

  const activeCat = activeCatId ?? visibleCats[0]?.id ?? null

  const displayItems = isCustomMode
    ? items.filter(item => (config.item_ids || []).includes(item.id))
    : items.filter(item => {
        if (item.category_id !== activeCat) return false
        if (!item.available && !config.show_unavailable_badge) return false
        return true
      })

  const paginationEnabled = config.pagination_enabled === true
  const itemsPerPage = Math.max(1, config.items_per_page ?? 12)
  const totalPages = paginationEnabled ? Math.max(1, Math.ceil(displayItems.length / itemsPerPage)) : 1
  const safePage = Math.min(page, totalPages)
  const visibleItems = paginationEnabled
    ? displayItems.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage)
    : displayItems

  useEffect(() => {
    setPage(1)
  }, [activeCat, paginationEnabled, itemsPerPage, isCustomMode, config.item_ids?.join(',')])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const colClass = menuGridColClass(layout, config.layout)
  const isList = config.layout === 'list'
  const sideTabs = visibleCats.length > 1 && config.tabs_layout !== 'horizontal' && !mobileLayout

  if (!isCustomMode && visibleCats.length === 0) {
    return (
      <section style={{ padding: '0 24px', textAlign: 'center' }}>
        <p style={{ color: textColor, opacity: 0.4, fontSize: '15px' }}>No menu categories yet.</p>
      </section>
    )
  }

  return (
    <>
      <section className={sectionPaddingClass(layout)}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Header */}
          {(sectionHeading || sectionDescription) && (
            <div style={{ marginBottom: '32px' }}>
              {sectionHeading && (
                <h2 style={{
                  color: textColor,
                  ...typography.h2,
                  marginBottom: sectionDescription ? '12px' : 0,
                  wordBreak: 'break-word'
                }}>
                  {sectionHeading}
                </h2>
              )}
              {sectionDescription && (
                <p style={{
                  color: textColor,
                  ...typography.bodyMd,
                  maxWidth: '700px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {sectionDescription}
                </p>
              )}
            </div>
          )}

          {/* Main Layout Container */}
          <div className={sideTabs
            ? desktopLayout
              ? 'flex flex-row gap-10 items-start'
              : 'flex flex-col md:flex-row gap-6 md:gap-10 md:items-start'
            : ''}>
            {/* Category tabs */}
            {config.show_category_tabs !== false && visibleCats.length > 1 && (
              <div 
                className={cn(
                  'flex gap-2 flex-nowrap overflow-x-auto hide-scrollbar pb-3 border-b border-gray-100 w-full',
                  config.tabs_layout !== 'horizontal' && !mobileLayout
                    ? desktopLayout
                      ? 'mb-0 border-b-0 pb-0 flex-col w-56 shrink-0 sticky top-[100px]'
                      : 'mb-2 md:mb-0 md:border-b-0 md:pb-0 md:flex-col md:w-56 md:shrink-0 md:sticky md:top-[100px]'
                    : 'mb-8 md:mb-8'
                )}
                style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
              >
                {visibleCats.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      if (activeCat === cat.id) return
                      setIsLoading(true)
                      
                      // 1. Give React a moment to render the loading toast
                      if (renderTimer.current) clearTimeout(renderTimer.current)
                      renderTimer.current = setTimeout(() => {
                        setActiveCatId(cat.id)
                        
                        // 2. Keep the loading toast on screen for a short minimum time so it doesn't just flash invisibly
                        if (loadingTimer.current) clearTimeout(loadingTimer.current)
                        loadingTimer.current = setTimeout(() => {
                          setIsLoading(false)
                        }, 400)
                      }, 10)
                    }}
                    className={cn(
                      'px-4 py-1.5 shrink-0 rounded-full text-sm font-medium transition-all',
                      config.tabs_layout !== 'horizontal' && !mobileLayout
                        ? desktopLayout
                          ? 'w-full text-left px-4 py-2.5 rounded-xl'
                          : 'md:w-full md:text-left md:px-4 md:py-2.5 md:rounded-xl'
                        : ''
                    )}
                    style={
                      activeCat === cat.id
                        ? { backgroundColor: textColor, color: sectionBg, border: `1.5px solid ${textColor}` }
                        : { backgroundColor: 'transparent', color: textColor, border: `1.5px solid ${textColor}22`, opacity: 0.7 }
                    }
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Items */}
            <div className="flex-1 min-w-0">
              {visibleItems.length === 0 ? (
                <p style={{ color: textColor, opacity: 0.4, fontSize: '14px', padding: '32px 0' }}>
                  {isCustomMode ? 'No items selected.' : 'No items in this category.'}
                </p>
              ) : (
                <>
                <div className={`grid gap-4 ${colClass}`}>
                  {visibleItems.map(item => {
                    const itemGroups = variantGroups.filter(g => g.item_id === item.id)
                    const hasVariants = itemGroups.length > 0
                    const optionCount = variantOptions.filter(o => itemGroups.some(g => g.id === o.group_id)).length
                    
                    return isList ? (
                      <ItemRowList key={item.id} item={item} config={config} onClick={() => setModalItem(item)} onQuickAdd={() => addItem(item, [])} hasVariants={hasVariants} optionCount={optionCount} />
                    ) : (
                      <ItemCardGrid key={item.id} item={item} config={config} onClick={() => setModalItem(item)} onQuickAdd={() => addItem(item, [])} hasVariants={hasVariants} optionCount={optionCount} />
                    )
                  })}
                </div>
                {paginationEnabled && totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border text-sm font-medium disabled:opacity-40 transition-colors"
                      style={{ color: textColor, borderColor: `${textColor}33` }}
                    >
                      {t('menuGridBlock.prevPage')}
                    </button>
                    <span className="text-sm tabular-nums" style={{ color: textColor, opacity: 0.7 }}>
                      {safePage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className="px-3 py-1.5 rounded-lg border text-sm font-medium disabled:opacity-40 transition-colors"
                      style={{ color: textColor, borderColor: `${textColor}33` }}
                    >
                      {t('menuGridBlock.nextPage')}
                    </button>
                  </div>
                )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Item detail + add to order modal */}
      {modalItem && (
        <ItemModal
          item={modalItem}
          groups={variantGroups}
          options={variantOptions}
          config={config}
          onClose={() => setModalItem(null)}
        />
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-black/90 text-white text-[13px] font-medium px-4 py-2 rounded-full shadow-lg flex items-center gap-2 backdrop-blur-sm">
            <svg className="animate-spin size-3.5 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t('publishing.loading')}
          </div>
        </div>
      )}
    </>
  )
}

// ─── Exported component ───────────────────────────────────────────────────────

interface MenuGridRenderProps {
  config: MenuGridConfig
  data: MenuGridData
}

export function MenuGridRender({
  config,
  data,
  previewLayout,
  isMobilePreview,
}: MenuGridRenderProps & { previewLayout?: PreviewLayout; isMobilePreview?: boolean }) {
  return (
    <MenuGridInner
      config={config}
      data={data}
      previewLayout={previewLayout}
      isMobilePreview={isMobilePreview}
    />
  )
}
