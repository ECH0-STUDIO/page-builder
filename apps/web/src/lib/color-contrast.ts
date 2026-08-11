/** Small helpers for readable text on arbitrary brand / page backgrounds. */

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.trim().replace(/^#/, '')
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(raw)) return null
  const full = raw.length === 3
    ? raw.split('').map(c => c + c).join('')
    : raw
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

export function contrastTextOnBackground(background: string): '#111111' | '#FFFFFF' {
  const rgb = parseHex(background)
  if (!rgb) return '#111111'
  return relativeLuminance(rgb.r, rgb.g, rgb.b) > 0.4 ? '#111111' : '#FFFFFF'
}

/** Tokens for order page chrome (header, filter bar, bottom bar) on a custom background. */
export function orderChromeTokens(background: string, brandColor: string) {
  const text = contrastTextOnBackground(background)
  const onDark = text === '#FFFFFF'
  const onBrand = contrastTextOnBackground(brandColor)

  return {
    background,
    text,
    mutedText: onDark ? 'rgba(255,255,255,0.72)' : 'rgba(17,17,17,0.55)',
    subtleText: onDark ? 'rgba(255,255,255,0.55)' : 'rgba(17,17,17,0.4)',
    border: onDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)',
    surfaceGlass: onDark
      ? `color-mix(in srgb, ${background} 72%, transparent)`
      : `color-mix(in srgb, ${background} 88%, white)`,
    inputBg: onDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
    inputBorder: onDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)',
    inputText: text,
    inputPlaceholder: onDark ? 'rgba(255,255,255,0.45)' : 'rgba(17,17,17,0.4)',
    chipBg: onDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
    chipText: onDark ? 'rgba(255,255,255,0.88)' : 'rgba(17,17,17,0.7)',
    chipBorder: onDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)',
    secondaryBtnBg: onDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
    secondaryBtnText: text,
    secondaryBtnBorder: onDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)',
    accentSurface: onDark ? 'rgba(255,255,255,0.12)' : 'rgba(17,17,17,0.06)',
    accentText: text,
    brandColor,
    brandText: onBrand,
    buttonBg: onDark ? '#FFFFFF' : '#111111',
    buttonText: onDark ? '#111111' : '#FFFFFF',
  }
}

export type OrderChromeTokens = ReturnType<typeof orderChromeTokens>
