/**
 * Theme CSS custom properties — shared between editor canvas and live page.
 */

import type { ThemeSettings } from './types'
import { defaultThemeSettings } from './types'

export interface ThemeTokenValues {
  brandColor: string
  pageBg: string
  pageText: string
}

export function resolveThemeTokens(theme?: Partial<ThemeSettings> | null): ThemeTokenValues {
  return {
    brandColor: theme?.primary_color ?? defaultThemeSettings.primary_color,
    pageBg: theme?.background_color ?? defaultThemeSettings.background_color,
    pageText: theme?.text_color ?? defaultThemeSettings.text_color,
  }
}

/** Inline style object with CSS variables for the page canvas / live store shell */
export function buildThemeStyle(theme?: Partial<ThemeSettings> | null): React.CSSProperties {
  const tokens = resolveThemeTokens(theme)
  return {
    backgroundColor: tokens.pageBg,
    color: tokens.pageText,
    '--brand-color': tokens.brandColor,
    '--page-bg': tokens.pageBg,
    '--page-text': tokens.pageText,
  } as React.CSSProperties
}
