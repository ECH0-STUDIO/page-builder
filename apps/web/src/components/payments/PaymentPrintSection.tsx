'use client'

/**
 * PaymentPrintSection — shows the QR print designer for the VietQR payment code.
 * Always rendered on the Payments page.
 * If VietQR isn't configured yet, shows a prompt to set it up above.
 */

import { QRPrintDesigner } from '@/components/qr/QRPrintDesigner'
import { buildVietQRUrl } from '@/lib/vietqr-utils'
import type { PaymentSettings } from '@/lib/vietqr-utils'
import { CreditCard } from 'lucide-react'
import { useTranslation } from '@/i18n/I18nProvider'

interface PaymentPrintSectionProps {
  businessId: string
  paymentSettings: PaymentSettings
  businessName: string
  businessLogoUrl: string | null
}

export function PaymentPrintSection({ businessId, paymentSettings, businessName, businessLogoUrl }: PaymentPrintSectionProps) {
  const { t } = useTranslation()

  if (!paymentSettings.vietqr) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <CreditCard className="size-10 text-gray-300" />
        <div>
          <p className="text-sm font-semibold text-gray-600">{t('payments.noVietqrTitle')}</p>
          <p className="text-xs text-gray-400 mt-1">
            {t('payments.noVietqrDesc')}
          </p>
        </div>
      </div>
    )
  }

  const qrImageSrc = buildVietQRUrl(paymentSettings.vietqr)

  return (
    <QRPrintDesigner
      businessId={businessId}
      qrUrl=""
      qrImageSrc={qrImageSrc}
      businessName={businessName}
      businessLogoUrl={businessLogoUrl || undefined}
    />
  )
}
