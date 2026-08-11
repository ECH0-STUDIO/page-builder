'use client'

/**
 * Order page bottom bar — cart summary + call-staff quick actions.
 * Categories live in a horizontal strip under the carousel (not here).
 */

import { useState, useEffect, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { Bell, Receipt, Loader2, X, ShoppingBag, Check } from 'lucide-react'
import { toast } from 'sonner'
import { createServiceRequestAction, type ServiceRequestType } from '@/app/actions/service-requests'
import { useTranslation } from '@/i18n/I18nProvider'
import { useCart } from '@/components/page-builder/render/CartContext'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { readRememberedTable, writeRememberedTable, loadPastOrders } from '@/lib/guest-order-storage'
import type { OrderChromeTokens } from '@/lib/color-contrast'

interface OrderBottomBarProps {
  businessId: string
  brandColor: string
  /** Pin bar inside a relative parent (builder phone frame) instead of the viewport */
  contained?: boolean
  /** Builder preview — cart open works; staff requests are simulated only */
  previewMode?: boolean
  /** When false, cart checkout is unavailable (outside opening hours) */
  orderingOpen?: boolean
  chrome?: OrderChromeTokens
}

export function OrderBottomBar({
  businessId,
  brandColor,
  contained = false,
  previewMode = false,
  orderingOpen = true,
  chrome,
}: OrderBottomBarProps) {
  const searchParams = useSearchParams()
  const tableFromUrl = (searchParams.get('table') ?? '').trim()
  const { t } = useTranslation()
  const { totalItems, totalPrice } = useCart()
  const [isPending, startTransition] = useTransition()
  const [pendingType, setPendingType] = useState<ServiceRequestType | null>(null)
  const [cooldown, setCooldown] = useState<Partial<Record<ServiceRequestType, boolean>>>({})
  const [actionsOpen, setActionsOpen] = useState(false)
  const [promptType, setPromptType] = useState<ServiceRequestType | null>(null)
  const [manualTable, setManualTable] = useState('')
  const [hasPlacedOrders, setHasPlacedOrders] = useState(false)
  /** Brief success beat before closing the sheet (Call staff / Request check). */
  const [sentFlash, setSentFlash] = useState<ServiceRequestType | null>(null)
  const [bellPulse, setBellPulse] = useState(false)

  const overlayPos = contained ? 'absolute' : 'fixed'
  const barPos = contained ? 'absolute' : 'fixed'

  useEffect(() => {
    if (tableFromUrl) {
      writeRememberedTable(businessId, tableFromUrl)
      setManualTable(tableFromUrl)
      setHasPlacedOrders(loadPastOrders(businessId, tableFromUrl).length > 0)
      return
    }
    const remembered = readRememberedTable(businessId)
    if (remembered) {
      setManualTable(remembered)
      setHasPlacedOrders(loadPastOrders(businessId, remembered).length > 0)
    } else {
      setHasPlacedOrders(false)
    }
  }, [businessId, tableFromUrl])

  // Refresh placed-order hint when cart clears (after placing) or table changes
  useEffect(() => {
    const table = (tableFromUrl || manualTable || readRememberedTable(businessId)).trim()
    if (!table) {
      setHasPlacedOrders(false)
      return
    }
    setHasPlacedOrders(loadPastOrders(businessId, table).length > 0)
  }, [businessId, tableFromUrl, manualTable, totalItems])

  useEffect(() => {
    function onStorage() {
      const table = (tableFromUrl || manualTable || readRememberedTable(businessId)).trim()
      if (table) setHasPlacedOrders(loadPastOrders(businessId, table).length > 0)
    }
    window.addEventListener('eatery-orders-updated', onStorage)
    return () => window.removeEventListener('eatery-orders-updated', onStorage)
  }, [businessId, tableFromUrl, manualTable])

  function startCooldown(type: ServiceRequestType) {
    setCooldown(prev => ({ ...prev, [type]: true }))
    window.setTimeout(() => {
      setCooldown(prev => ({ ...prev, [type]: false }))
    }, 30_000)
  }

  function pulseBell() {
    setBellPulse(true)
    window.setTimeout(() => setBellPulse(false), 700)
  }

  function finishSuccess(type: ServiceRequestType, tableNumber: string) {
    startCooldown(type)
    setPromptType(null)
    setManualTable(tableNumber)
    setSentFlash(type)
    pulseBell()
    toast.success(
      type === 'call_staff'
        ? t('orderPage.callStaffSent')
        : t('orderPage.requestCheckSent'),
    )
    window.setTimeout(() => {
      setSentFlash(null)
      setActionsOpen(false)
    }, 900)
  }

  function submit(type: ServiceRequestType, table: string) {
    const tableNumber = table.trim()
    if (!tableNumber) {
      toast.error(t('orderPage.enterTableFirst'))
      return
    }

    writeRememberedTable(businessId, tableNumber)

    if (previewMode) {
      startCooldown(type)
      setPromptType(null)
      setManualTable(tableNumber)
      setSentFlash(type)
      pulseBell()
      toast.info(t('cart.previewDisabled'))
      window.setTimeout(() => {
        setSentFlash(null)
        setActionsOpen(false)
      }, 900)
      return
    }

    setPendingType(type)
    startTransition(async () => {
      const res = await createServiceRequestAction(businessId, tableNumber, type)
      setPendingType(null)
      if (!res.success) {
        toast.error(res.error)
        return
      }
      finishSuccess(type, tableNumber)
    })
  }

  function handleAction(type: ServiceRequestType) {
    if (cooldown[type] || isPending || sentFlash) return
    if (previewMode) {
      toast.info(t('cart.previewDisabled'))
      setActionsOpen(false)
      return
    }
    if (tableFromUrl) {
      submit(type, tableFromUrl)
      return
    }
    const remembered = (manualTable || readRememberedTable(businessId)).trim()
    if (remembered) setManualTable(remembered)
    setPromptType(type)
  }

  function openCart() {
    const tab = totalItems === 0 && hasPlacedOrders ? 'placed' : 'current'
    window.dispatchEvent(new CustomEvent('eatery-open-cart', { detail: { tab } }))
  }

  function openActions() {
    pulseBell()
    setActionsOpen(true)
  }

  const cartSubtitle = !orderingOpen
    ? t('orderPage.closedBannerHint')
    : totalItems > 0
      ? `${t('orderPage.itemsCount').replace('{{count}}', String(totalItems))} · ${formatCurrency(totalPrice)}`
      : hasPlacedOrders
        ? t('cart.viewPlacedOrder')
        : t('cart.empty')

  const cartTitle = !orderingOpen
    ? t('orderPage.closedShort')
    : totalItems > 0
      ? t('orderPage.viewOrder')
      : hasPlacedOrders
        ? t('cart.myOrder')
        : t('cart.viewOrder')

  return (
    <>
      <div
        className={cn(
          'bottom-0 inset-x-0 z-40 border-t backdrop-blur-md',
          barPos,
          !contained && 'pb-[env(safe-area-inset-bottom)]',
          !chrome && 'border-black/6 bg-white/95',
        )}
        style={
          chrome
            ? {
                backgroundColor: chrome.surfaceGlass,
                borderColor: chrome.border,
              }
            : undefined
        }
      >
        <div className="mx-auto flex w-full max-w-[430px] md:max-w-5xl gap-2 px-3 py-2.5">
          <button
            type="button"
            onClick={openCart}
            className={cn(
              'flex-1 inline-flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-200 active:scale-[0.98]',
              !orderingOpen
                ? 'border border-amber-200 bg-amber-50 text-amber-950'
                : totalItems > 0
                  ? ''
                  : !chrome && 'border border-gray-200 bg-white text-gray-800 hover:bg-gray-50',
            )}
            style={
              !orderingOpen
                ? undefined
                : totalItems > 0
                  ? {
                      backgroundColor: brandColor,
                      color: chrome?.brandText ?? '#FFFFFF',
                    }
                  : chrome
                    ? {
                        backgroundColor: chrome.secondaryBtnBg,
                        borderColor: chrome.secondaryBtnBorder,
                        color: chrome.secondaryBtnText,
                        borderWidth: 1,
                        borderStyle: 'solid',
                      }
                    : undefined
            }
          >
            <ShoppingBag className="size-4 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold truncate">{cartTitle}</span>
              <span
                className={cn(
                  'block text-[11px] truncate',
                  !orderingOpen && 'text-amber-900/70',
                  orderingOpen && totalItems === 0 && !chrome && 'text-gray-500',
                )}
                style={
                  orderingOpen && totalItems > 0
                    ? { color: chrome ? `${chrome.brandText}bf` : 'rgba(255,255,255,0.75)' }
                    : orderingOpen && totalItems === 0 && chrome
                      ? { color: chrome.mutedText }
                      : undefined
                }
              >
                {cartSubtitle}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={openActions}
            className={cn(
              'shrink-0 inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.96]',
              !chrome && 'border border-gray-200 bg-white text-gray-800 hover:bg-gray-50',
            )}
            style={
              chrome
                ? {
                    backgroundColor: chrome.secondaryBtnBg,
                    borderColor: chrome.secondaryBtnBorder,
                    color: chrome.secondaryBtnText,
                    borderWidth: 1,
                    borderStyle: 'solid',
                  }
                : undefined
            }
          >
            <Bell
              className={cn(
                'size-4 transition-transform origin-top',
                bellPulse || cooldown.call_staff ? 'animate-[bell-ring_0.7s_ease-in-out]' : '',
              )}
              style={{ color: brandColor }}
            />
            <span className="hidden min-[360px]:inline">{t('orderPage.callStaff')}</span>
          </button>
        </div>
      </div>

      {/* Quick actions sheet */}
      {actionsOpen && (
        <div className={cn('inset-0 z-50 flex items-end justify-center animate-in fade-in duration-200', overlayPos)}>
          <button
            type="button"
            className="absolute inset-0 bg-black/40 animate-in fade-in duration-200"
            aria-label={t('orderPage.cancel')}
            onClick={() => {
              if (sentFlash || isPending) return
              setActionsOpen(false)
            }}
          />
          <div className="relative w-full max-w-[430px] rounded-t-2xl bg-white shadow-xl overflow-hidden pb-[env(safe-area-inset-bottom)] animate-in slide-in-from-bottom-4 duration-300">
            {sentFlash ? (
              <div className="px-5 py-10 flex flex-col items-center justify-center gap-3 text-center animate-in zoom-in-95 fade-in duration-300">
                <div
                  className="size-14 rounded-full flex items-center justify-center text-white shadow-lg animate-in zoom-in-50 duration-300"
                  style={{ backgroundColor: brandColor }}
                >
                  {sentFlash === 'call_staff' ? (
                    <Bell className="size-6 animate-[bell-ring_0.7s_ease-in-out]" />
                  ) : (
                    <Check className="size-7" strokeWidth={3} />
                  )}
                </div>
                <p className="text-base font-semibold text-gray-900">
                  {sentFlash === 'call_staff'
                    ? t('orderPage.callStaffSent')
                    : t('orderPage.requestCheckSent')}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">{t('orderPage.quickActions')}</h3>
                  <button
                    type="button"
                    onClick={() => setActionsOpen(false)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="p-3 space-y-2">
                  <button
                    type="button"
                    disabled={isPending || Boolean(cooldown.call_staff)}
                    onClick={() => handleAction('call_staff')}
                    className="w-full flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3.5 text-left hover:bg-gray-50 disabled:opacity-50 transition-all duration-150 active:scale-[0.98]"
                  >
                    {pendingType === 'call_staff' ? (
                      <Loader2 className="size-5 animate-spin" style={{ color: brandColor }} />
                    ) : cooldown.call_staff ? (
                      <Check className="size-5 text-emerald-600" strokeWidth={3} />
                    ) : (
                      <Bell className="size-5" style={{ color: brandColor }} />
                    )}
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-gray-900">
                        {cooldown.call_staff ? t('orderPage.sent') : t('orderPage.callStaff')}
                      </span>
                      <span className="block text-xs text-gray-500 mt-0.5">{t('orderPage.enterTablePrompt')}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={isPending || Boolean(cooldown.request_check)}
                    onClick={() => handleAction('request_check')}
                    className="w-full flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3.5 text-left hover:bg-gray-50 disabled:opacity-50 transition-all duration-150 active:scale-[0.98]"
                  >
                    {pendingType === 'request_check' ? (
                      <Loader2 className="size-5 animate-spin" style={{ color: brandColor }} />
                    ) : cooldown.request_check ? (
                      <Check className="size-5 text-emerald-600" strokeWidth={3} />
                    ) : (
                      <Receipt className="size-5" style={{ color: brandColor }} />
                    )}
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-gray-900">
                        {cooldown.request_check ? t('orderPage.sent') : t('orderPage.requestCheck')}
                      </span>
                      <span className="block text-xs text-gray-500 mt-0.5">{t('orderPage.requestCheck')}</span>
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {promptType && (
        <div className={cn('inset-0 z-[60] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200', overlayPos)}>
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t('orderPage.cancel')}
            onClick={() => { setPromptType(null); setManualTable('') }}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl space-y-4 animate-in slide-in-from-bottom-3 sm:zoom-in-95 duration-300">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {promptType === 'call_staff' ? t('orderPage.callStaff') : t('orderPage.requestCheck')}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{t('orderPage.enterTablePrompt')}</p>
              </div>
              <button
                type="button"
                onClick={() => { setPromptType(null); setManualTable('') }}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X className="size-4" />
              </button>
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={manualTable}
              onChange={e => setManualTable(e.target.value)}
              placeholder={t('cart.tablePlaceholder')}
              className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:border-gray-400"
              autoFocus
            />
            <button
              type="button"
              disabled={isPending || !manualTable.trim()}
              onClick={() => submit(promptType, manualTable)}
              className="w-full h-11 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-transform active:scale-[0.98]"
              style={{ backgroundColor: brandColor }}
            >
              {isPending ? <Loader2 className="size-4 animate-spin mx-auto" /> : t('orderPage.sendRequest')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
