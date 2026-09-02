'use client'

/**
 * PaymentPrintSection — shows the QR print designer for the VietQR payment code.
 */

import { useState } from 'react'
import { QRPrintDesigner } from '@/components/qr/QRPrintDesigner'
import { buildVietQRUrl } from '@/lib/vietqr-utils'
import type { PaymentSettings } from '@/lib/vietqr-utils'
import { CreditCard } from 'lucide-react'
import { useTranslation } from '@/i18n/I18nProvider'
import type { StoreLanguageConfig } from '@/i18n/store-locale'
import { parseStoreLanguageConfig } from '@/i18n/store-locale'
import { localeTabLabel } from '@/components/i18n/EditorLocaleContext'
import { cn } from '@/lib/utils'

interface PaymentPrintSectionProps {
  businessId: string
  paymentSettings: PaymentSettings
  businessName: string
  businessLogoUrl: string | null
  storeLanguage?: StoreLanguageConfig
}

export function PaymentPrintSection({
  businessId,
  paymentSettings,
  businessName,
  businessLogoUrl,
  storeLanguage: storeLanguageProp,
}: PaymentPrintSectionProps) {
  const { t } = useTranslation()
  const storeLanguage = storeLanguageProp ?? parseStoreLanguageConfig({ language: 'vi' })
  const [contentLocale, setContentLocale] = useState(storeLanguage.primary_locale)

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
    <div className="space-y-4">
      {storeLanguage.dual_language_enabled && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{t('qr.printLanguage') || 'Print language'}:</span>
          <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-0.5">
            {[storeLanguage.primary_locale, storeLanguage.secondary_locale].map(locale => (
              <button
                key={locale}
                type="button"
                onClick={() => setContentLocale(locale)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  contentLocale === locale ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700',
                )}
              >
                {localeTabLabel(locale)}
              </button>
            ))}
          </div>
        </div>
      )}
      <QRPrintDesigner
        businessId={businessId}
        qrUrl=""
        qrImageSrc={qrImageSrc}
        businessName={businessName}
        businessLogoUrl={businessLogoUrl || undefined}
        storeLanguage={storeLanguage}
        contentLocale={contentLocale}
      />
    </div>
  )
}
