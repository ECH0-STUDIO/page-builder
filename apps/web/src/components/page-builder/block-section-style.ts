/**
 * Section surface (background) applied on the block wrapper so padding
 * and background colour share the same box.
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
        return { backgroundColor: c.background_color }
      }
      if (c.background === 'gradient') {
        return {
          background: `linear-gradient(135deg, ${c.gradient_from ?? '#f8f8f8'} 0%, ${c.gradient_to ?? '#e8e8e8'} 100%)`,
        }
      }
      return {}
    }
    default:
      return {}
  }
}

/** Full-width section surface + inner padding layer (background outside padding). */
export function getBlockSurfaceLayers(block: PageBlock): {
  margin: CSSProperties
  surface: CSSProperties
  padding: CSSProperties
} {
  const spacing = resolveBlockSpacing(block.type, block.spacing)
  return {
    margin: {
      marginTop: spacing.margin_top,
      marginBottom: spacing.margin_bottom,
    },
    surface: {
      width: '100%',
      boxSizing: 'border-box',
      ...getBlockSectionSurface(block),
    },
    padding: {
      paddingTop: spacing.padding_top,
      paddingRight: spacing.padding_right,
      paddingBottom: spacing.padding_bottom,
      paddingLeft: spacing.padding_left,
    },
  }
}
