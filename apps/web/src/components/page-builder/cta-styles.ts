/**
 * Shared CTA button styling — uses brand color by default, per-CTA override when set.
 */

import type { CtaButton } from './types'

function contrastText(hex: string): string {
  const c = hex.replace('#', '')
  if (c.length !== 6) return '#ffffff'
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? '#111111' : '#ffffff'
}

export function resolveCtaColor(cta: CtaButton, brandColor: string): string {
  return cta.color && cta.color.trim() !== '' ? cta.color : brandColor
}

export function getCtaClassName(style: CtaButton['style']): string {
  if (style === 'text') {
    return 'inline font-semibold text-sm tracking-wide transition-opacity hover:opacity-90 underline underline-offset-4'
  }
  return 'inline-block px-7 py-3.5 rounded-full font-semibold text-sm tracking-wide transition-opacity hover:opacity-90 select-none'
}

export function getCtaInlineStyle(
  cta: CtaButton,
  brandColor: string,
): React.CSSProperties {
  const color = resolveCtaColor(cta, brandColor)
  switch (cta.style) {
    case 'filled':
      return { backgroundColor: color, color: contrastText(color) }
    case 'outlined':
      return { border: `2px solid ${color}`, color, backgroundColor: 'transparent' }
    case 'text':
      return { color, textDecoration: 'underline', textUnderlineOffset: '4px' }
    default:
      return {}
  }
}

/** QR border radius values — separate from padding */
export const QR_BORDER_RADIUS: Record<string, string> = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  '3xl': '24px',
  full: '9999px',
}
