'use client'

/**
 * QRCodeRender — live QR code block for the public page.
 * Generates the QR entirely client-side (no API, no cost).
 */

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Download } from 'lucide-react'
import type { QRCodeConfig } from '../types'
import { buildVietQRUrl, type PaymentSettings } from '@/lib/vietqr-utils'
import { pickLocale, toSupportedLocale, type SupportedLocale } from '@/i18n/locale'

interface QRCodeRenderProps {
  config: QRCodeConfig
  /** Resolved target URL (for custom links or fallback) */
  targetUrl: string
  /** Passed down to generate VietQR if target is payment */
  paymentSettings?: PaymentSettings | null
  /** Optional translated label for download button */
  downloadLabel?: string
  locale?: string
}

const SIZE_MAP: Record<QRCodeConfig['size'], number> = {
  sm: 140,
  md: 200,
  lg: 280,
}

export function QRCodeRender({ config, targetUrl, paymentSettings, downloadLabel = 'Save QR Code', locale }: QRCodeRenderProps) {
  const activeLocale = toSupportedLocale(locale)
  const label = pickLocale(config.label, activeLocale)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rendered, setRendered] = useState(false)
  const bgColor = config.background_color || '#ffffff'
  const textColor = config.text_color || '#111111'
  const px = SIZE_MAP[config.size] ?? 200

  const paddingMap: Record<string, number> = {
    'none': 0, 'sm': 4, 'md': 8, 'lg': 12, 'xl': 16, '2xl': 20, '3xl': 24, 'full': px * 0.16
  }
  const pad = paddingMap[config.border_radius || '2xl'] ?? 20
  const innerPx = px - pad * 2

  const isPayment = config.target === 'payment'
  const vietQrUrl = isPayment && paymentSettings?.vietqr ? buildVietQRUrl(paymentSettings.vietqr) : ''
  const finalTargetUrl = isPayment && !vietQrUrl ? targetUrl : targetUrl // fallback if payment isn't setup

  useEffect(() => {
    // If it's a VietQR image, we don't draw canvas
    if (isPayment && vietQrUrl) return
    if (!canvasRef.current || !finalTargetUrl) return
    QRCode.toCanvas(canvasRef.current, finalTargetUrl, {
      width: innerPx,
      margin: 1,
      color: { dark: textColor, light: bgColor },
      errorCorrectionLevel: 'H',
    }, () => setRendered(true))
  }, [finalTargetUrl, innerPx, textColor, bgColor, isPayment, vietQrUrl])

  async function download() {
    let dataUrl = ''
    if (isPayment && vietQrUrl) {
      // Just download the VietQR image
      const res = await fetch(vietQrUrl)
      const blob = await res.blob()
      dataUrl = URL.createObjectURL(blob)
    } else {
      dataUrl = await QRCode.toDataURL(finalTargetUrl, {
        width: 1000,
        margin: 2,
        color: { dark: textColor, light: '#ffffff' },
        errorCorrectionLevel: 'H',
      })
    }
    const a = document.createElement('a')
    a.download = 'page-qr.png'
    a.href = dataUrl
    a.click()
  }

  const alignClass = config.alignment === 'left' ? 'items-start' : config.alignment === 'right' ? 'items-end' : 'items-center'
  
  const bgStyle: React.CSSProperties = {
    backgroundColor: bgColor,
    padding: '48px 24px',
    ...(config.background_image ? {
      backgroundImage: `url(${config.background_image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    } : {})
  }

  return (
    <section style={bgStyle}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }} className={`flex flex-col ${alignClass} gap-4`}>
        {/* Canvas */}
        <div
          className={`overflow-hidden shadow-md rounded-${config.border_radius || '2xl'} flex items-center justify-center`}
          style={{ width: px, height: px, backgroundColor: bgColor, padding: pad }}
        >
          {isPayment && vietQrUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vietQrUrl} alt="Payment QR" style={{ width: innerPx, height: innerPx, objectFit: 'contain' }} />
          ) : (
            <canvas
              ref={canvasRef}
              className={`transition-opacity duration-300 ${rendered ? 'opacity-100' : 'opacity-0'}`}
            />
          )}
        </div>

        {/* Label */}
        {label && (
          <p className="text-sm font-medium text-center" style={{ color: textColor, opacity: 0.7 }}>
            {label}
          </p>
        )}

        {/* Download button for visitors */}
        {config.show_download && (
          <button
            onClick={download}
            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-full border transition-colors hover:opacity-80"
            style={{ color: textColor, borderColor: `${textColor}40` }}
          >
            <Download className="size-3.5" />
            {downloadLabel}
          </button>
        )}
      </div>
    </section>
  )
}
