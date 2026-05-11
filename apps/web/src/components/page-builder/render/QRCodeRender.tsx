'use client'

/**
 * QRCodeRender — live QR code block for the public page.
 * Generates the QR entirely client-side (no API, no cost).
 */

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Download } from 'lucide-react'
import type { QRCodeConfig } from '../types'

interface QRCodeRenderProps {
  config: QRCodeConfig
  /** Resolved target URL — passed from the server (slug is known server-side) */
  targetUrl: string
}

const SIZE_MAP: Record<QRCodeConfig['size'], number> = {
  sm: 140,
  md: 200,
  lg: 280,
}

export function QRCodeRender({ config, targetUrl }: QRCodeRenderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rendered, setRendered] = useState(false)
  const bgColor = config.background_color || '#ffffff'
  const textColor = config.text_color || '#111111'
  const px = SIZE_MAP[config.size] ?? 200

  useEffect(() => {
    if (!canvasRef.current || !targetUrl) return
    QRCode.toCanvas(canvasRef.current, targetUrl, {
      width: px,
      margin: 2,
      color: { dark: textColor, light: bgColor },
      errorCorrectionLevel: 'H',
    }, () => setRendered(true))
  }, [targetUrl, px, textColor, bgColor])

  async function download() {
    const dataUrl = await QRCode.toDataURL(targetUrl, {
      width: 1000,
      margin: 2,
      color: { dark: textColor, light: '#ffffff' },
      errorCorrectionLevel: 'H',
    })
    const a = document.createElement('a')
    a.download = 'page-qr.png'
    a.href = dataUrl
    a.click()
  }

  const alignClass = config.alignment === 'left' ? 'items-start' : config.alignment === 'right' ? 'items-end' : 'items-center'

  return (
    <section
      style={{ backgroundColor: bgColor, padding: '48px 24px' }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }} className={`flex flex-col ${alignClass} gap-4`}>
        {/* Canvas */}
        <div
          className="rounded-2xl overflow-hidden shadow-md"
          style={{ width: px, height: px, backgroundColor: bgColor }}
        >
          <canvas
            ref={canvasRef}
            className={`transition-opacity duration-300 ${rendered ? 'opacity-100' : 'opacity-0'}`}
          />
        </div>

        {/* Label */}
        {config.label && (
          <p className="text-sm font-medium text-center" style={{ color: textColor, opacity: 0.7 }}>
            {config.label}
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
            Save QR Code
          </button>
        )}
      </div>
    </section>
  )
}
