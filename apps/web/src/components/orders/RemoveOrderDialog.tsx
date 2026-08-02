'use client'

import { useState } from 'react'
import { ORDER_REMOVE_REASONS, type OrderRemoveReasonCode } from '@/lib/order-retention'
import { useTranslation } from '@/i18n/I18nProvider'

interface RemoveOrderDialogProps {
  open: boolean
  onCancel: () => void
  onConfirm: (payload: { reasonCode: OrderRemoveReasonCode; reason?: string }) => void
  busy?: boolean
}

export function RemoveOrderDialog({ open, onCancel, onConfirm, busy }: RemoveOrderDialogProps) {
  const { t } = useTranslation()
  const [reasonCode, setReasonCode] = useState<OrderRemoveReasonCode>('customer_cancels')
  const [custom, setCustom] = useState('')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        role="dialog"
        aria-modal
        className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100 p-5 space-y-4"
      >
        <div>
          <h3 className="text-lg font-bold text-gray-900">{t('orders.removeTitle')}</h3>
          <p className="text-sm text-gray-500 mt-1">{t('orders.removeHelp')}</p>
        </div>

        <div className="space-y-2">
          {ORDER_REMOVE_REASONS.map((code) => (
            <label
              key={code}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
                reasonCode === code ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="remove-reason"
                checked={reasonCode === code}
                onChange={() => setReasonCode(code)}
                className="accent-gray-900"
              />
              <span className="text-sm font-medium text-gray-800">
                {t(`orders.removeReasons.${code}`)}
              </span>
            </label>
          ))}
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">
            {t('orders.removeExtraNote')}
          </label>
          <input
            type="text"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder={t('orders.removeExtraPlaceholder')}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 h-10 rounded-lg bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 disabled:opacity-50"
          >
            {t('orders.cancel')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              onConfirm({
                reasonCode,
                reason: custom.trim() || undefined,
              })
            }
            className="flex-1 h-10 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50"
          >
            {t('orders.confirmRemove')}
          </button>
        </div>
      </div>
    </div>
  )
}
