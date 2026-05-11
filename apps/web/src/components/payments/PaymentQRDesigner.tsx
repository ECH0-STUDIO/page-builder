'use client'

/**
 * PaymentQRDesigner — wraps QRPrintDesigner for the VietQR payment context.
 * Uses the VietQR image API as the QR source instead of generating one.
 */

import { QRPrintDesigner } from '@/components/qr/QRPrintDesigner'
import { buildVietQRUrl } from '@/lib/vietqr-utils'
import type { PaymentSettings } from '@/lib/vietqr-utils'

interface PaymentQRDesignerProps {
  paymentSettings: PaymentSettings
  businessName: string
  businessLogoUrl: string | null
}

export function PaymentQRDesigner({
  paymentSettings,
  businessName,
  businessLogoUrl,
}: PaymentQRDesignerProps) {
  if (!paymentSettings.vietqr) return null

  const qrImageSrc = buildVietQRUrl(paymentSettings.vietqr)

  return (
    <QRPrintDesigner
      qrImageSrc={qrImageSrc}
      businessName={businessName}
      businessLogoUrl={businessLogoUrl}
    />
  )
}
