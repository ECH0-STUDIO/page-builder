'use client'

/**
 * Order page bottom bar — cart summary + call-staff quick actions.
 * Categories live in a horizontal strip under the carousel (not here).
 */

import { useState, useEffect, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { Bell, Receipt, Loader2, X, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { createServiceRequestAction, type ServiceRequestType } from '@/app/actions/service-requests'
import { useTranslation } from '@/i18n/I18nProvider'
import { useCart } from '@/components/page-builder/render/CartContext'
import { formatCurrency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { readRememberedTable, writeRememberedTable } from '@/lib/guest-order-storage'

interface OrderBottomBarProps {
  businessId: string
  brandColor: string
  /** Pin bar inside a relative parent (builder phone frame) instead of the viewport */
  contained?: boolean
  /** Builder preview — cart open works; staff requests are simulated only */
  previewMode?: boolean
  /** When false, cart checkout is unavailable (outside opening hours) */
  orderingOpen?: boolean
}

export function OrderBottomBar({
  businessId,
  brandColor,
  contained = false,
  previewMode = false,
  orderingOpen = true,
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

  const overlayPos = contained ? 'absolute' : 'fixed'
  const barPos = contained ? 'absolute' : 'fixed'

  useEffect(() => {
    if (tableFromUrl) {
      writeRememberedTable(businessId, tableFromUrl)
      return
    }
    const remembered = readRememberedTable(businessId)
    if (remembered) setManualTable(remembered)
  }, [businessId, tableFromUrl])

  function startCooldown(type: ServiceRequestType) {
    setCooldown(prev => ({ ...prev, [type]: true }))
    window.setTimeout(() => {
      setCooldown(prev => ({ ...prev, [type]: false }))
    }, 30_000)
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
      setActionsOpen(false)
      toast.info(t('cart.previewDisabled'))
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
      startCooldown(type)
      setPromptType(null)
      setActionsOpen(false)
      setManualTable(tableNumber)
      toast.success(
        type === 'call_staff'
          ? t('orderPage.callStaffSent')
          : t('orderPage.requestCheckSent'),
      )
    })
  }

  function handleAction(type: ServiceRequestType) {
    if (cooldown[type] || isPending) return
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
    window.dispatchEvent(new Event('eatery-open-cart'))
  }

  return (
    <>
      <div
        className={cn(
          'bottom-0 inset-x-0 z-40 border-t border-black/6 bg-white/95 backdrop-blur-md',
          barPos,
          !contained && 'pb-[env(safe-area-inset-bottom)]',
        )}
      >
        <div className="mx-auto flex max-w-[430px] gap-2 px-3 py-2.5">
          <button
            type="button"
            onClick={openCart}
            className={cn(
              'flex-1 inline-flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors',
              !orderingOpen
                ? 'border border-amber-200 bg-amber-50 text-amber-950'
                : totalItems > 0
                  ? 'text-white'
                  : 'border border-gray-200 bg-white text-gray-800 hover:bg-gray-50',
            )}
            style={orderingOpen && totalItems > 0 ? { backgroundColor: brandColor } : undefined}
          >
            <ShoppingBag className="size-4 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold truncate">
                {!orderingOpen
                  ? t('orderPage.closedShort')
                  : totalItems > 0
                    ? t('orderPage.viewOrder')
                    : t('cart.viewOrder')}
              </span>
              <span className={cn(
                'block text-[11px] truncate',
                !orderingOpen
                  ? 'text-amber-900/70'
                  : totalItems > 0 ? 'text-white/75' : 'text-gray-500',
              )}>
                {!orderingOpen
                  ? t('orderPage.closedBannerHint')
                  : totalItems > 0
                    ? `${t('orderPage.itemsCount').replace('{{count}}', String(totalItems))} · ${formatCurrency(totalPrice)}`
                    : t('cart.empty')}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActionsOpen(true)}
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
          >
            <Bell className="size-4" style={{ color: brandColor }} />
            <span className="hidden min-[360px]:inline">{t('orderPage.callStaff')}</span>
          </button>
        </div>
      </div>

      {/* Quick actions sheet */}
      {actionsOpen && (
        <div className={cn('inset-0 z-50 flex items-end justify-center', overlayPos)}>
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t('orderPage.cancel')}
            onClick={() => setActionsOpen(false)}
          />
          <div className="relative w-full max-w-[430px] rounded-t-2xl bg-white shadow-xl overflow-hidden pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{t('orderPage.quickActions')}</h3>
              <button
                type="button"
                onClick={() => setActionsOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-3 space-y-2">
              <button
                type="button"
                disabled={isPending || Boolean(cooldown.call_staff)}
                onClick={() => handleAction('call_staff')}
                className="w-full flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3.5 text-left hover:bg-gray-50 disabled:opacity-50"
              >
                {pendingType === 'call_staff' ? (
                  <Loader2 className="size-5 animate-spin" style={{ color: brandColor }} />
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
                className="w-full flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3.5 text-left hover:bg-gray-50 disabled:opacity-50"
              >
                {pendingType === 'request_check' ? (
                  <Loader2 className="size-5 animate-spin" style={{ color: brandColor }} />
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
          </div>
        </div>
      )}

      {promptType && (
        <div className={cn('inset-0 z-[60] flex items-end sm:items-center justify-center p-4', overlayPos)}>
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t('orderPage.cancel')}
            onClick={() => { setPromptType(null); setManualTable('') }}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl space-y-4">
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
              className="w-full h-11 rounded-xl text-sm font-bold text-white disabled:opacity-50"
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
