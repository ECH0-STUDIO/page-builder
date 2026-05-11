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

interface PaymentPrintSectionProps {
  paymentSettings: PaymentSettings
  businessName: string
  businessLogoUrl: string | null
}

export function PaymentPrintSection({ paymentSettings, businessName, businessLogoUrl }: PaymentPrintSectionProps) {
  if (!paymentSettings.vietqr) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <CreditCard className="size-10 text-gray-300" />
        <div>
          <p className="text-sm font-semibold text-gray-600">No VietQR configured yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Fill in your bank account details above and save to unlock the print designer.
          </p>
        </div>
      </div>
    )
  }

  const qrImageSrc = buildVietQRUrl(paymentSettings.vietqr)

  return (
    <QRPrintDesigner
      qrImageSrc={qrImageSrc}
      businessName={businessName}
      businessLogoUrl={businessLogoUrl}
    />
  )
}
