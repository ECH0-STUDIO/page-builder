/**
 * Section surface (background) on the block shell so padding and background
 * share one full-width box — edge to edge of the page/canvas.
 *
 * Hero is an exception: visuals are full-bleed inside the shell (no shell padding).
 * Outer padding is passed as contentInset to HeroRender so backgrounds/images still
 * fill the entire section while text/content respects the inset.
 */

import type { CSSProperties } from 'react'
import type {
  PageBlock,
  BlockSpacing,
  ContactConfig,
  MenuGridConfig,
  QRCodeConfig,
  TextImageConfig,
  HeroConfig,
} from './types'
import { resolveBlockSpacing } from './spacing-utils'

export interface BlockContentInset {
  padding_top: number
  padding_right: number
  padding_bottom: number
  padding_left: number
}

export function contentInsetStyle(inset: BlockContentInset): CSSProperties {
  return {
    paddingTop: inset.padding_top,
    paddingRight: inset.padding_right,
    paddingBottom: inset.padding_bottom,
    paddingLeft: inset.padding_left,
  }
}

function spacingToInset(spacing: BlockSpacing): BlockContentInset {
  return {
    padding_top: spacing.padding_top,
    padding_right: spacing.padding_right,
    padding_bottom: spacing.padding_bottom,
    padding_left: spacing.padding_left,
  }
}

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
  /** Hero only — padding applied inside render so visuals stay full-bleed */
  contentInset?: BlockContentInset
} {
  const spacing = resolveBlockSpacing(
    block.type,
    block.spacing,
    block.type === 'hero' ? { heroConfig: block.config as HeroConfig } : undefined,
  )
  const isHero = block.type === 'hero'

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
      ...(isHero
        ? {}
        : {
            paddingTop: spacing.padding_top,
            paddingRight: spacing.padding_right,
            paddingBottom: spacing.padding_bottom,
            paddingLeft: spacing.padding_left,
          }),
    },
    ...(isHero ? { contentInset: spacingToInset(spacing) } : {}),
  }
}
