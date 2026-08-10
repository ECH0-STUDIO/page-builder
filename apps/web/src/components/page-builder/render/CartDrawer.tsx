'use client'

/**
 * CartDrawer — floating cart button + side drawer with Current / Placed tabs
 */

import { useState, useEffect, useTransition } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { ShoppingBag, Plus, Minus, Trash2, ChevronRight, UtensilsCrossed, Loader2, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { useCart, type CartItem } from './CartContext'
import Image from 'next/image'
import { createOrderAction } from '@/app/actions/orders'
import type { PaymentSettings } from '@/lib/vietqr-utils'
import { buildVietQRUrl, VIET_BANKS } from '@/lib/vietqr-utils'
import { toast } from 'sonner'
import { useTranslationWithFallback } from '@/i18n/I18nProvider'
import { toSupportedLocale, type SupportedLocale } from '@/i18n/locale'
import {
  loadPastOrders,
  savePastOrders,
  readRememberedTable,
  writeRememberedTable,
  type GuestPastOrder,
} from '@/lib/guest-order-storage'

// ─── Cart Item Row ─────────────────────────────────────────────────────────────

function CartItemRow({ item, locale }: { item: CartItem; locale: SupportedLocale }) {
  const { removeItem, updateQuantity } = useCart()
  const activeLocale = toSupportedLocale(locale)
  const { t } = useTranslationWithFallback(activeLocale)

  return (
    <div className="flex gap-3 py-4 border-b border-gray-100 last:border-0">
      {item.itemImage && (
        <div className="size-14 rounded-xl bg-gray-100 overflow-hidden shrink-0 relative">
          <Image src={item.itemImage} alt={item.itemName} fill className="object-cover" sizes="56px" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900 leading-snug">{item.itemName}</p>
        {item.variants.length > 0 && (
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
            {item.variants.map(v => v.optionLabel).join(', ')}
          </p>
        )}
        <p className="text-sm font-bold text-gray-800 mt-1">{formatCurrency(item.totalPrice)}</p>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <button onClick={() => removeItem(item.cartId)} className="text-gray-300 hover:text-red-400 transition-colors p-0.5" aria-label={t('cart.removeItem')}>
          <Trash2 className="size-3.5" />
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => updateQuantity(item.cartId, -1)} className="size-7 rounded-full border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors">
            <Minus className="size-3" />
          </button>
          <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
          <button onClick={() => updateQuantity(item.cartId, +1)} className="size-7 rounded-full border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors">
            <Plus className="size-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main CartDrawer ──────────────────────────────────────────────────────────

interface CartDrawerProps {
  businessId?: string
  paymentSettings?: PaymentSettings
  /** When true, cart UI works but placing orders is blocked. */
  previewMode?: boolean
  /** Pin overlays inside a relative canvas (page builder) instead of the viewport */
  contained?: boolean
  locale?: string
  /** Tailwind bottom offset for the floating cart FAB (e.g. bottom-24 above service bar) */
  fabOffsetClass?: string
  /** Brand / primary colour for FAB + checkout CTA */
  brandColor?: string
  /** Hide floating FAB — cart is opened from the order bottom bar instead */
  hideFab?: boolean
  /** When false, outside opening hours — block place order */
  orderingOpen?: boolean
}

type DrawerTab = 'current' | 'placed'

function formatOrderTime(timestamp: number, locale: SupportedLocale): string {
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'vi-VN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function CartDrawer({
  businessId,
  paymentSettings,
  previewMode,
  contained,
  locale = 'vi',
  fabOffsetClass = 'bottom-6',
  brandColor = '#E85D26',
  hideFab = false,
  orderingOpen = true,
}: CartDrawerProps) {
  const { items, totalItems, totalPrice, clearCart } = useCart()
  const activeLocale = toSupportedLocale(locale)
  const { t } = useTranslationWithFallback(activeLocale)
  const actionColor = brandColor || '#E85D26'
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const tableFromUrl = (searchParams.get('table') ?? '').trim()

  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<DrawerTab>('current')
  const [justPlaced, setJustPlaced] = useState(false)
  const [tableNumber, setTableNumber] = useState(tableFromUrl)
  const [tableHydrated, setTableHydrated] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [pastOrders, setPastOrders] = useState<GuestPastOrder[]>([])

  const effectiveTable = (tableFromUrl || tableNumber).trim()
  const position = contained ? 'absolute' : 'fixed'

  // Hard guard: never show cart chrome on marketing/landing (/{slug}).
  const isOrderRoute = Boolean(
    pathname && /(^|\/)order\/?$/.test(pathname.split('?')[0] ?? ''),
  )
  const cartAllowed = Boolean(contained || previewMode || isOrderRoute)

  // Prefill table from ?table= or remembered localStorage value
  useEffect(() => {
    if (previewMode && !tableFromUrl) {
      setTableNumber('1')
      setTableHydrated(true)
      return
    }
    if (tableFromUrl) {
      setTableNumber(tableFromUrl)
      if (businessId) writeRememberedTable(businessId, tableFromUrl)
      setTableHydrated(true)
      return
    }
    if (businessId) {
      const remembered = readRememberedTable(businessId)
      if (remembered) setTableNumber(remembered)
    }
    setTableHydrated(true)
  }, [previewMode, tableFromUrl, businessId])

  // Load placed orders whenever business + table is known
  useEffect(() => {
    if (!businessId || !effectiveTable) {
      setPastOrders([])
      return
    }
    setPastOrders(loadPastOrders(businessId, effectiveTable))
  }, [businessId, effectiveTable])

  useEffect(() => {
    const openDrawer = (event: Event) => {
      const detail = (event as CustomEvent<{ tab?: DrawerTab }>).detail
      // Prefer Placed when cart is empty but this table has history
      let nextTab: DrawerTab = 'current'
      if (detail?.tab === 'placed' || detail?.tab === 'current') {
        nextTab = detail.tab
      } else if (totalItems === 0) {
        nextTab = 'placed'
      }
      setTab(nextTab)
      setJustPlaced(false)
      setOpen(true)
    }
    window.addEventListener('eatery-open-cart', openDrawer)
    return () => window.removeEventListener('eatery-open-cart', openDrawer)
  }, [totalItems])

  // Persist manual table as the diner types (so call-staff / refresh keep it)
  useEffect(() => {
    if (!tableHydrated || !businessId || tableFromUrl || previewMode) return
    const trimmed = tableNumber.trim()
    if (!trimmed) return
    const timer = window.setTimeout(() => writeRememberedTable(businessId, trimmed), 400)
    return () => window.clearTimeout(timer)
  }, [tableNumber, businessId, tableFromUrl, previewMode, tableHydrated])

  // Auto-close only when Current is empty and there is nothing placed for this table
  useEffect(() => {
    if (!cartAllowed || !open) return
    if (tab === 'current' && totalItems === 0 && !justPlaced && pastOrders.length === 0) {
      setOpen(false)
    }
  }, [cartAllowed, open, tab, totalItems, justPlaced, pastOrders.length])

  // Always stay mounted on the order page (hideFab) so bottom-bar can reopen the drawer.
  // Elsewhere, hide when empty with no placed history.
  if (!cartAllowed) return null
  if (!hideFab && totalItems === 0 && !open && pastOrders.length === 0) return null

  function handleTableChange(value: string) {
    setTableNumber(value)
  }

  async function handlePlaceOrder() {
    if (previewMode) {
      toast.info(t('cart.previewDisabled'))
      return
    }
    if (!orderingOpen) {
      toast.error(t('cart.closedForOrders'))
      return
    }
    if (!businessId) {
      toast.error(t('cart.businessIdMissing'))
      return
    }
    if (!effectiveTable) {
      toast.error(t('cart.enterTableNumber'))
      return
    }

    const tableForOrder = effectiveTable
    writeRememberedTable(businessId, tableForOrder)

    startTransition(async () => {
      const res = await createOrderAction(businessId, tableForOrder, items, totalPrice)
      if (res.success) {
        const orderData: GuestPastOrder = {
          id: res.orderId ?? `local-${Date.now()}`,
          items,
          total: totalPrice,
          timestamp: Date.now(),
          table: tableForOrder,
        }
        const updatedOrders = [orderData, ...pastOrders]
        setPastOrders(updatedOrders)
        savePastOrders(businessId, tableForOrder, updatedOrders)
        clearCart()
        setJustPlaced(true)
        setTab('placed')
      } else {
        const closed = res.error === 'CLOSED' || ('code' in res && res.code === 'CLOSED')
        toast.error(closed ? t('cart.closedForOrders') : `${t('cart.placeOrderFailed')} ${res.error}`)
      }
    })
  }

  function handleClose() {
    setOpen(false)
    setTimeout(() => {
      setJustPlaced(false)
      setTab('current')
    }, 300)
  }

  const hasVietQR = paymentSettings?.vietqr && paymentSettings.vietqr.bank_code
  const showReceiptFab = !hideFab && !open && totalItems === 0 && pastOrders.length > 0

  const ui = (
    <>
      {/* ── Floating cart button ── */}
      {!hideFab && !open && totalItems > 0 && (
        <button
          onClick={() => { setTab('current'); setOpen(true) }}
          className={`${position} ${fabOffsetClass} right-4 z-[100] flex items-center gap-2.5 text-white pl-4 pr-5 py-3.5 rounded-full shadow-2xl shadow-black/30 hover:opacity-90 active:scale-95 transition-all ${contained ? 'pointer-events-auto' : ''}`}
          style={{ backgroundColor: actionColor }}
          aria-label={t('cart.viewOrder')}
        >
          <div className="relative">
            <ShoppingBag className="size-5" />
            <span className="absolute -top-2 -right-2 size-4.5 min-w-[18px] px-0.5 bg-amber-400 text-amber-900 text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {totalItems}
            </span>
          </div>
          <div className="text-sm leading-tight text-left">
            <p className="font-semibold">{t('cart.viewOrder')}</p>
            <p className="text-white/60 text-xs">{formatCurrency(totalPrice)}</p>
          </div>
        </button>
      )}

      {/* ── Floating Receipt button ── */}
      {showReceiptFab && (
        <button
          onClick={() => { setTab('placed'); setOpen(true) }}
          className={`${position} ${fabOffsetClass} right-4 z-[100] flex items-center gap-2.5 bg-white border border-gray-200 text-gray-900 px-5 py-3.5 rounded-full shadow-2xl shadow-black/10 hover:bg-gray-50 active:scale-95 transition-all ${contained ? 'pointer-events-auto' : ''}`}
        >
          <div className="relative">
            <CheckCircle2 className="size-5 text-green-500" />
          </div>
          <div className="text-sm leading-tight text-left">
            <p className="font-semibold">{t('cart.myOrder')}</p>
            <p className="text-gray-500 text-xs">{t('cart.viewPlacedOrder')}</p>
          </div>
        </button>
      )}

      {/* ── Backdrop ── */}
      {open && (
        <div
          className={`${position} inset-0 z-[100] bg-black/40 backdrop-blur-sm ${contained ? 'pointer-events-auto' : ''}`}
          onClick={handleClose}
        />
      )}

      {/* ── Right side drawer ── */}
      <div
        className={`${position} top-0 bottom-0 right-0 z-[110] bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col w-full sm:w-[400px] max-w-[100vw] ${contained ? 'pointer-events-auto' : ''} ${
          open ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            {justPlaced ? (
              <CheckCircle2 className="size-5 text-green-500" />
            ) : (
              <UtensilsCrossed className="size-4 text-gray-400" />
            )}
            <h2 className="font-bold text-gray-900 text-base">
              {justPlaced ? t('cart.orderSent') : t('cart.yourOrder')}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="size-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Tabs: Current | Placed */}
        <div className="px-5 pt-3 shrink-0 border-b border-gray-100">
          <div className="flex gap-6" role="tablist" aria-label={t('cart.yourOrder')}>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'current'}
              onClick={() => { setTab('current'); setJustPlaced(false) }}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === 'current'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t('cart.tabCurrent')}
              {totalItems > 0 && (
                <span className="ml-1.5 text-xs font-bold text-gray-500">({totalItems})</span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'placed'}
              onClick={() => setTab('placed')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === 'placed'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t('cart.tabPlaced')}
              {pastOrders.length > 0 && (
                <span className="ml-1.5 text-xs font-bold text-gray-500">({pastOrders.length})</span>
              )}
            </button>
          </div>
        </div>

        {/* ── TAB: CURRENT ── */}
        {tab === 'current' && (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              {items.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <p className="text-sm font-medium text-gray-500">{t('cart.empty')}</p>
                  {pastOrders.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTab('placed')}
                      className="text-sm font-semibold text-gray-800 underline underline-offset-2"
                    >
                      {t('cart.viewPlacedOrder')}
                    </button>
                  )}
                </div>
              ) : (
                items.map(item => (
                  <CartItemRow key={item.cartId} item={item} locale={activeLocale} />
                ))
              )}
            </div>

            <div className="px-5 pb-8 pt-4 space-y-4 shrink-0 border-t border-gray-100 bg-white">
              {/* Table Number Input */}
              {paymentSettings?.kds_enabled !== false && (
                tableFromUrl ? (
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('cart.tableNumber')}</span>
                    <span className="text-sm font-bold text-gray-900 px-3 py-1 bg-gray-100 rounded-lg">{tableFromUrl}</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('cart.tableNumber')}</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={tableNumber}
                      onChange={e => handleTableChange(e.target.value)}
                      placeholder={t('cart.tablePlaceholder')}
                      className="h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 text-sm font-medium"
                    />
                  </div>
                )
              )}

              {/* Total */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-gray-500 text-sm">{t('cart.total')}</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(totalPrice)}</span>
              </div>

              {/* Place Order button */}
              {paymentSettings?.kds_enabled === false ? (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center mt-2">
                  <p className="text-sm text-orange-800 font-medium">{t('cart.callWaiter')}</p>
                </div>
              ) : !orderingOpen ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center mt-2">
                  <p className="text-sm text-amber-900 font-medium">{t('cart.closedForOrders')}</p>
                </div>
              ) : !effectiveTable ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center mt-2">
                  <p className="text-sm text-gray-600 font-medium">{t('cart.enterTableOrScan')}</p>
                </div>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  disabled={isPending || items.length === 0}
                  className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2.5 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg disabled:opacity-70 disabled:pointer-events-none"
                  style={{ backgroundColor: actionColor }}
                >
                  {isPending ? <Loader2 className="size-5 animate-spin" /> : previewMode ? t('cart.testPlaceOrder') : t('cart.placeOrder')}
                </button>
              )}
            </div>
          </>
        )}

        {/* ── TAB: PLACED ── */}
        {tab === 'placed' && (
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 bg-gray-50/50">
            {!effectiveTable ? (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 text-center space-y-3">
                <p className="text-sm text-gray-600 font-medium">{t('cart.enterTableToSeePlaced')}</p>
                {!tableFromUrl && (
                  <input
                    type="text"
                    inputMode="numeric"
                    value={tableNumber}
                    onChange={e => handleTableChange(e.target.value)}
                    placeholder={t('cart.tablePlaceholder')}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400 text-sm font-medium"
                  />
                )}
              </div>
            ) : pastOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
                <p className="text-sm text-gray-500 font-medium">{t('cart.noPlacedOrders')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pastOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start gap-3 mb-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500">
                          {t('cart.orderPlacedAt').replace(
                            '{{time}}',
                            formatOrderTime(order.timestamp, activeLocale),
                          )}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {t('cart.tableNumber')} {effectiveTable}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-300 font-mono shrink-0">
                        #{order.id.slice(0, 8)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {(order.items as CartItem[]).map(item => (
                        <div key={`${order.id}-${item.cartId}`} className="flex justify-between text-sm">
                          <div className="flex gap-2 min-w-0">
                            <span className="font-bold text-gray-900">{item.quantity}×</span>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800">{item.itemName}</p>
                              {item.variants && item.variants.length > 0 && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {item.variants.map(v => v.optionLabel).join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="font-medium text-gray-900 shrink-0 ml-3">
                            {formatCurrency(item.totalPrice * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-100">
                      <span className="text-sm font-semibold text-gray-700">{t('cart.orderTotal')}</span>
                      <span className="font-bold text-gray-900">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                ))}

                {pastOrders.length > 1 && (
                  <div className="flex justify-between items-center px-1 pt-1">
                    <span className="text-sm font-semibold text-gray-500">{t('cart.grandTotal')}</span>
                    <span className="font-bold text-lg text-gray-900">
                      {formatCurrency(pastOrders.reduce((acc, o) => acc + o.total, 0))}
                    </span>
                  </div>
                )}
              </div>
            )}

            {(justPlaced || pastOrders.length > 0) && hasVietQR && (() => {
              const vietqr = paymentSettings.vietqr!
              const vietqrImageUrl = buildVietQRUrl(vietqr)
              const bankName = VIET_BANKS.find(b => b.code === vietqr.bank_code)?.name ?? vietqr.bank_code

              return (
                <div className="border border-gray-100 rounded-3xl p-8 flex flex-col items-center gap-6 bg-gradient-to-b from-white to-gray-50 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50 -mr-10 -mt-10 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-50 rounded-full blur-3xl opacity-50 -ml-10 -mb-10 pointer-events-none" />

                  <div className="relative z-10 w-full flex flex-col items-center gap-4 text-center mb-2">
                    <h3 className="font-bold text-gray-900 text-lg">{t('cart.payWithBankingApp')}</h3>
                    <p className="text-sm text-gray-500">{t('cart.scanQrToPay')}</p>
                  </div>

                  <div className="relative z-10 w-full flex flex-col items-center gap-6">
                    <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={vietqrImageUrl} alt="VietQR payment code" className="w-[220px] h-[220px] object-contain" />
                    </div>

                    <div className="text-center space-y-1.5 w-full bg-white/60 backdrop-blur-sm rounded-xl py-4 px-6 border border-gray-100/50">
                      <p className="font-bold text-gray-900 text-lg leading-tight">{vietqr.account_name}</p>
                      <p className="text-sm text-gray-600 font-medium">{bankName}</p>
                      <div className="inline-flex items-center gap-2 mt-1 px-3 py-1 bg-gray-100/80 rounded-lg">
                        <span className="text-xs text-gray-500 font-semibold uppercase">{t('cart.accountNumber')}</span>
                        <p className="text-sm text-gray-900 font-bold tracking-wide">{vietqr.account_number}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {justPlaced && !hasVietQR && (
              <div className="text-center py-8 px-4 space-y-4">
                <div className="size-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="size-8 text-green-500" />
                </div>
                <h3 className="font-bold text-xl text-gray-900">{t('cart.orderReceived')}</h3>
                <p className="text-gray-500">{t('cart.orderSentKitchen')}</p>
              </div>
            )}

            <div className="text-center px-4 pb-4">
              <p className="text-xs text-gray-400">{t('cart.modifyCancel')}<br/>{t('cart.notifyStaff')}</p>
              <button onClick={handleClose} className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-full transition-colors text-sm">
                {t('cart.closeReturnMenu')}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )

  if (contained) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[100]">
        {ui}
      </div>
    )
  }

  return ui
}
