/**
 * Block spacing helpers — apply per-type defaults when spacing was never configured.
 */

import type { BlockType, BlockSpacing, PageBlock } from './types'
import { defaultSpacing, BLOCK_DEFAULT_SPACING, SECTION_SIDE_PADDING } from './types'

export { SECTION_SIDE_PADDING }

const SIDE_PADDING_TYPES = new Set<BlockType>(['text_image', 'contact', 'menu_grid', 'qr_code'])

function applySectionSidePadding(type: BlockType, spacing: BlockSpacing): BlockSpacing {
  if (!SIDE_PADDING_TYPES.has(type)) return spacing
  return {
    ...spacing,
    padding_left: spacing.padding_left > 0 ? spacing.padding_left : SECTION_SIDE_PADDING,
    padding_right: spacing.padding_right > 0 ? spacing.padding_right : SECTION_SIDE_PADDING,
  }
}

function isUnsetSpacing(spacing: BlockSpacing): boolean {
  return (
    spacing.padding_top === 0 &&
    spacing.padding_right === 0 &&
    spacing.padding_bottom === 0 &&
    spacing.padding_left === 0 &&
    spacing.margin_top === 0 &&
    spacing.margin_bottom === 0
  )
}

/** Resolve effective spacing for render — uses type defaults when all values are zero. */
export function resolveBlockSpacing(type: BlockType, spacing?: BlockSpacing | null): BlockSpacing {
  const saved = spacing ?? defaultSpacing
  const defaults = BLOCK_DEFAULT_SPACING[type]
  if (isUnsetSpacing(saved) && defaults) {
    return applySectionSidePadding(type, { ...defaults })
  }
  if (defaults) {
    return applySectionSidePadding(type, {
      padding_top: saved.padding_top || defaults.padding_top,
      padding_right: saved.padding_right || defaults.padding_right,
      padding_bottom: saved.padding_bottom || defaults.padding_bottom,
      padding_left: saved.padding_left || defaults.padding_left,
      margin_top: saved.margin_top,
      margin_bottom: saved.margin_bottom,
    })
  }
  return applySectionSidePadding(type, { ...saved })
}

export function normalizePageBlock(block: PageBlock): PageBlock {
  return {
    ...block,
    spacing: resolveBlockSpacing(block.type, block.spacing),
    custom_css: block.custom_css ?? '',
    block_anchor_id: block.block_anchor_id ?? null,
  }
}
