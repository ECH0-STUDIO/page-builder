import React from 'react'

export interface TypographyToken {
  fontSize: string
  fontWeight?: number
  lineHeight?: number | string
  letterSpacing?: string
  opacity?: number
}

export function getTypography(isMobilePreview?: boolean) {
  return {
    h1: {
      fontSize: isMobilePreview ? '28px' : 'clamp(28px, 4.5vw, 48px)',
      fontWeight: 800,
      lineHeight: 1.15,
      letterSpacing: '-0.025em',
    } as TypographyToken,
    
    h2: {
      fontSize: isMobilePreview ? '22px' : 'clamp(22px, 3.5vw, 36px)',
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: '-0.015em',
    } as TypographyToken,
    
    bodyLg: {
      fontSize: isMobilePreview ? '16px' : 'clamp(16px, 3vw, 20px)',
      lineHeight: 1.5,
    } as TypographyToken,
    
    bodyMd: {
      fontSize: isMobilePreview ? '14px' : 'clamp(14px, 2.5vw, 16px)',
      lineHeight: 1.6,
    } as TypographyToken,
  }
}
