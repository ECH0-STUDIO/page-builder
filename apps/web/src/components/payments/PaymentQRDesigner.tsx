'use client'

/**
 * PaymentQRDesigner — wraps QRPrintDesigner for the VietQR payment context.
 * Uses the VietQR image API as the QR source instead of generating one.
 */

import { QRPrintDesigner } from '@/components/qr/QRPrintDesigner'
import { buildVietQRUrl } from '@/lib/vietqr-utils'
import type { PaymentSettings } from '@/lib/vietqr-utils'

interface PaymentQRDesignerProps {
  businessId: string
  paymentSettings: PaymentSettings
  businessName: string
  businessLogoUrl: string | null
}

export function PaymentQRDesigner({
  businessId,
  paymentSettings,
  businessName,
  businessLogoUrl,
}: PaymentQRDesignerProps) {
  if (!paymentSettings.vietqr) return null

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
