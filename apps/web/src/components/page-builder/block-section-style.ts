/**
 * Section surface (background) on the block shell so padding and background
 * share one full-width box — edge to edge of the page/canvas.
 */

import type { CSSProperties } from 'react'
import type {
  PageBlock,
  ContactConfig,
  MenuGridConfig,
  QRCodeConfig,
  TextImageConfig,
} from './types'
import { resolveBlockSpacing } from './spacing-utils'

export function getBlockSectionSurface(block: PageBlock): CSSProperties {
  const config = block.config

  switch (block.type) {
    case 'contact':
      return { backgroundColor: (config as ContactConfig).background_color ?? '#f8f8f8' }
    case 'menu_grid':
      return { backgroundColor: (config as MenuGridConfig).background_color || '#ffffff' }
    case 'qr_code': {
      const c = config as QRCodeConfig
      return {
        backgroundColor: c.background_color || '#ffffff',
        ...(c.background_image
          ? {
              backgroundImage: `url(${c.background_image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : {}),
      }
    }
    case 'text_image': {
      const c = config as TextImageConfig
      if (c.background === 'solid') {
        return { backgroundColor: c.background_color || '#f9f9f9' }
      }
      if (c.background === 'gradient') {
        return {
          background: `linear-gradient(135deg, ${c.gradient_from ?? '#f8f8f8'} 0%, ${c.gradient_to ?? '#e8e8e8'} 100%)`,
        }
      }
      return {}
    }
    // Hero paints its own full-bleed visuals inside the shell
    case 'hero':
      return {}
    default:
      return {}
  }
}

/** Margin outside the section; shell = full-width background + padding in one box. */
export function getBlockSurfaceLayers(block: PageBlock): {
  margin: CSSProperties
  shell: CSSProperties
} {
  const spacing = resolveBlockSpacing(block.type, block.spacing)
  return {
    margin: {
      marginTop: spacing.margin_top,
      marginBottom: spacing.margin_bottom,
    },
    shell: {
      width: '100%',
      display: 'block',
      boxSizing: 'border-box',
      ...getBlockSectionSurface(block),
      paddingTop: spacing.padding_top,
      paddingRight: spacing.padding_right,
      paddingBottom: spacing.padding_bottom,
      paddingLeft: spacing.padding_left,
    },
  }
}
