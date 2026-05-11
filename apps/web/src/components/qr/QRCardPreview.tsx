'use client'

/**
 * QRCardPreview — the printable card.
 * A forwardRef div so html-to-image can capture it at full resolution.
 *
 * Layout rules:
 *  - QR size = min(available width, available height after logo+text)
 *  - Font sizes scale proportionally with card width
 *  - Content never overflows — padding slider directly limits QR
 */

import { forwardRef, useEffect, useRef } from 'react'
import { getFontStack } from '@/lib/fonts'

// ─── Types ────────────────────────────────────────────────────────────────────

export type QRStyle = 'square' | 'rounded' | 'dots' | 'extra-rounded'
export type SizePreset = 'square' | 'a7' | 'a6' | 'a4'

const COMPACT_SIZES: SizePreset[] = ['square']  // subtext hidden on compact sizes
const LOGO_SIZE = 64  // fixed px

export interface QRDesign {
  bg_type: 'solid' | 'gradient'
  bg_color: string
  bg_color2: string
  bg_direction: string
  bg_image_data: string | null
  logo_data: string | null
  qr_color: string
  qr_style: QRStyle
  headline: string
  subtext: string
  heading_font: string    // for the headline
  body_font: string       // for the subtext
  text_color: string
  padding: number
  corner_radius: number
  size: SizePreset
}

export const SIZE_PRESETS: Record<SizePreset, { w: number; h: number; label: string; desc: string }> = {
  square:  { w: 380, h: 380,  label: 'Square',    desc: '9 × 9 cm'       },
  a7:      { w: 298, h: 420,  label: 'A7',         desc: '7.4 × 10.5 cm'  },
  a6:      { w: 420, h: 595,  label: 'A6',         desc: '10.5 × 14.8 cm' },
  a4:      { w: 595, h: 842,  label: 'A4 Poster',  desc: '21 × 29.7 cm'   },
}

export const DEFAULT_DESIGN: QRDesign = {
  bg_type: 'solid',
  bg_color: '#ffffff',
  bg_color2: '#ffe8d6',
  bg_direction: 'to bottom right',
  bg_image_data: null,
  logo_data: null,
  qr_color: '#111111',
  qr_style: 'square',
  headline: '',
  subtext: 'Scan to view our menu',
  heading_font: 'Inter',
  body_font: 'Inter',
  text_color: '#111111',
  padding: 40,
  corner_radius: 16,
  size: 'square',
}

// ─── QR size calculation (prevents overflow) ──────────────────────────────────

function calcQrPx(design: QRDesign, preset: { w: number; h: number }): number {
  const isCompact = COMPACT_SIZES.includes(design.size)
  const gap = isCompact ? 10 : 14

  const availW = preset.w - design.padding * 2
  const availH = preset.h - design.padding * 2

  // Vertical space consumed by non-QR elements
  const logoH = design.logo_data ? LOGO_SIZE + gap : 0
  const hasText = design.headline || (!isCompact && design.subtext)
  // Font size is ~4.5% of card width — give two lines of headroom
  const lineH = Math.round(preset.w * 0.048)
  const textH = hasText ? ((!isCompact && design.subtext && design.headline) ? lineH * 2 + 6 + gap : lineH + gap) : 0

  const maxFromH = availH - logoH - textH
  return Math.max(60, Math.min(availW, maxFromH))
}

// ─── Component ────────────────────────────────────────────────────────────────

interface QRCardPreviewProps {
  design: QRDesign
  qrUrl?: string
  qrImageSrc?: string
}

export const QRCardPreview = forwardRef<HTMLDivElement, QRCardPreviewProps>(
  function QRCardPreview({ design, qrUrl, qrImageSrc }, ref) {
    const qrRef = useRef<HTMLDivElement>(null)
    const preset = SIZE_PRESETS[design.size]
    const isCompact = COMPACT_SIZES.includes(design.size)
    const qrPx = calcQrPx(design, preset)

    // Font stacks
    const headingFontStack = getFontStack(design.heading_font)
    const bodyFontStack = getFontStack(design.body_font)

    const gap = isCompact ? 10 : 14

    // Background
    let background: string
    if (design.bg_image_data) {
      background = `url(${design.bg_image_data}) center/cover no-repeat`
    } else if (design.bg_type === 'gradient') {
      background = `linear-gradient(${design.bg_direction}, ${design.bg_color}, ${design.bg_color2})`
    } else {
      background = design.bg_color
    }

    // Render QR via qr-code-styling
    useEffect(() => {
      if (!qrRef.current || !qrUrl) return
      qrRef.current.innerHTML = ''

      const styleMap: Record<QRStyle, string> = {
        square: 'square', rounded: 'rounded', dots: 'dots', 'extra-rounded': 'extra-rounded',
      }

      import('qr-code-styling').then(({ default: QRCodeStyling }) => {
        if (!qrRef.current) return
        const qr = new QRCodeStyling({
          width: qrPx, height: qrPx,
          type: 'canvas',
          data: qrUrl,
          dotsOptions: { type: styleMap[design.qr_style] as never, color: design.qr_color },
          backgroundOptions: { color: 'transparent' },
          qrOptions: { errorCorrectionLevel: 'H' },
          cornersSquareOptions: {
            type: design.qr_style === 'square' ? 'square' : 'extra-rounded',
            color: design.qr_color,
          },
          cornersDotOptions: {
            type: design.qr_style === 'square' ? 'square' : 'dot',
            color: design.qr_color,
          },
        } as never)
        qr.append(qrRef.current)
      })
    }, [qrUrl, design.qr_style, design.qr_color, qrPx])

    return (
      <div
        ref={ref}
        style={{
          width: preset.w,
          height: preset.h,
          background,
          borderRadius: design.corner_radius,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap,
          // fontFamily applied per-element (heading_font / body_font)
          flexShrink: 0,
          // No overflow:hidden here so we can see clipping in dev — but content calc prevents it
          boxSizing: 'border-box',
          padding: design.padding,
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        {design.logo_data && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={design.logo_data}
            alt="Logo"
            style={{
              width: LOGO_SIZE, height: LOGO_SIZE,
              objectFit: 'contain',
              borderRadius: 8,
              flexShrink: 0,
            }}
          />
        )}

        {/* QR: generated */}
        {qrUrl && (
          <div
            ref={qrRef}
            style={{
              width: qrPx, height: qrPx,
              flexShrink: 0,
              borderRadius: design.qr_style !== 'square' ? 12 : 0,
              overflow: 'hidden',
            }}
          />
        )}

        {/* QR: VietQR image */}
        {qrImageSrc && !qrUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrImageSrc}
            alt="Payment QR"
            crossOrigin="anonymous"
            style={{ width: qrPx, height: qrPx, objectFit: 'contain', flexShrink: 0 }}
          />
        )}

        {/* Text */}
        {(design.headline || (!isCompact && design.subtext)) && (
          <div style={{ textAlign: 'center', color: design.text_color, flexShrink: 0 }}>
            {design.headline && (
              <p style={{
                fontFamily: headingFontStack,
                fontWeight: 700,
                fontSize: Math.round(preset.w * 0.048),
                margin: '0 0 4px',
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
              }}>
                {design.headline}
              </p>
            )}
            {!isCompact && design.subtext && (
              <p style={{
                fontFamily: bodyFontStack,
                fontWeight: 400,
                fontSize: Math.round(preset.w * 0.034),
                margin: 0,
                opacity: 0.65,
                lineHeight: 1.3,
              }}>
                {design.subtext}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)
