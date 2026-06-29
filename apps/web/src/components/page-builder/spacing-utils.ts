/**
 * Block spacing helpers — apply per-type defaults when spacing was never configured.
 */

import type { BlockType, BlockSpacing, PageBlock } from './types'
import { defaultSpacing, BLOCK_DEFAULT_SPACING } from './types'

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
  if (isUnsetSpacing(saved) && BLOCK_DEFAULT_SPACING[type]) {
    return { ...BLOCK_DEFAULT_SPACING[type]! }
  }
  return { ...saved }
}

export function normalizePageBlock(block: PageBlock): PageBlock {
  return {
    ...block,
    spacing: resolveBlockSpacing(block.type, block.spacing),
    custom_css: block.custom_css ?? '',
    block_anchor_id: block.block_anchor_id ?? null,
  }
}
