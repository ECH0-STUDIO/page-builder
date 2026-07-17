'use client'

/**
 * Guest actions on the order page: Call staff / Request check.
 * Uses ?table= when present; otherwise prompts for a table number.
 */

import { useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { Bell, Receipt, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { createServiceRequestAction, type ServiceRequestType } from '@/app/actions/service-requests'
import { useTranslation } from '@/i18n/I18nProvider'

interface OrderServiceActionsProps {
  businessId: string
  brandColor: string
}

export function OrderServiceActions({ businessId, brandColor }: OrderServiceActionsProps) {
  const searchParams = useSearchParams()
  const tableFromUrl = (searchParams.get('table') ?? '').trim()
  const { t } = useTranslation()
  const [isPending, startTransition] = useTransition()
  const [pendingType, setPendingType] = useState<ServiceRequestType | null>(null)
  const [cooldown, setCooldown] = useState<Partial<Record<ServiceRequestType, boolean>>>({})
  const [promptType, setPromptType] = useState<ServiceRequestType | null>(null)
  const [manualTable, setManualTable] = useState('')

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
      setManualTable('')
      toast.success(
        type === 'call_staff'
          ? t('orderPage.callStaffSent')
          : t('orderPage.requestCheckSent'),
      )
    })
  }

  function handleClick(type: ServiceRequestType) {
    if (cooldown[type] || isPending) return
    if (tableFromUrl) {
      submit(type, tableFromUrl)
      return
    }
    setPromptType(type)
  }

  return (
    <>
      <div className="sticky top-14 z-30 border-b border-black/6 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] gap-2 px-4 py-2.5 sm:px-6">
          <button
            type="button"
            onClick={() => handleClick('call_staff')}
            disabled={isPending || Boolean(cooldown.call_staff)}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {pendingType === 'call_staff' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Bell className="size-4" style={{ color: brandColor }} />
            )}
            {cooldown.call_staff ? t('orderPage.sent') : t('orderPage.callStaff')}
          </button>
          <button
            type="button"
            onClick={() => handleClick('request_check')}
            disabled={isPending || Boolean(cooldown.request_check)}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-colors"
            style={{ backgroundColor: brandColor }}
          >
            {pendingType === 'request_check' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Receipt className="size-4" />
            )}
            {cooldown.request_check ? t('orderPage.sent') : t('orderPage.requestCheck')}
          </button>
        </div>
      </div>

      {promptType && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
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
