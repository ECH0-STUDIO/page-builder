/**
 * Section spacing presets — small / medium / large instead of manual px controls.
 */

import type { BlockType, BlockSpacing, FooterConfig, HeroConfig } from './types'
import { defaultSpacing, SECTION_SIDE_PADDING } from './types'
import { resolveHeroHeight } from './hero-utils'

export type SectionSize = 'small' | 'medium' | 'large'

export const SECTION_SIZE_OPTIONS: { label: string; value: SectionSize }[] = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
]

/** Vertical padding scale per block type (top/bottom px at medium). */
const MEDIUM_VERTICAL: Partial<Record<BlockType, number>> = {
  hero: 64,
  text_image: 64,
  contact: 64,
  menu_grid: 64,
  qr_code: 48,
}

const SIZE_MULTIPLIER: Record<SectionSize, number> = {
  small: 0.5,
  medium: 1,
  large: 1.5,
}

/** Outer margin stays 0 for every size — section spacing only scales padding. */
const SIZE_MARGIN: Record<SectionSize, { margin_top: number; margin_bottom: number }> = {
  small: { margin_top: 0, margin_bottom: 0 },
  medium: { margin_top: 0, margin_bottom: 0 },
  large: { margin_top: 0, margin_bottom: 0 },
}

/** Horizontal inset is constant across sizes/block types so mobile L/R padding stays consistent. */
const SIDE_PADDING_BY_SIZE: Record<SectionSize, number> = {
  small: SECTION_SIDE_PADDING,
  medium: SECTION_SIDE_PADDING,
  large: SECTION_SIDE_PADDING,
}

function mediumSpacingForType(type: BlockType): BlockSpacing {
  const vertical = MEDIUM_VERTICAL[type] ?? 64
  return {
    padding_top: vertical,
    padding_right: SECTION_SIDE_PADDING,
    padding_bottom: vertical,
    padding_left: SECTION_SIDE_PADDING,
    margin_top: 0,
    margin_bottom: 0,
  }
}

/** Resolve numeric spacing from a preset size. */
export function spacingFromSize(
  type: BlockType,
  size: SectionSize,
  heroConfig?: Pick<HeroConfig, 'height'>,
): BlockSpacing {
  if (type === 'hero' && heroConfig && resolveHeroHeight(heroConfig.height) === 'fullscreen') {
    return { ...defaultSpacing }
  }

  const medium = mediumSpacingForType(type)
  const mult = SIZE_MULTIPLIER[size]
  const margin = SIZE_MARGIN[size]
  const side = SIDE_PADDING_BY_SIZE[size]

  return {
    padding_top: Math.round(medium.padding_top * mult),
    padding_right: side,
    padding_bottom: Math.round(medium.padding_bottom * mult),
    padding_left: side,
    margin_top: margin.margin_top,
    margin_bottom: margin.margin_bottom,
  }
}

/** Guess preset from saved numeric spacing (for loading legacy blocks). */
export function inferSpacingSize(
  type: BlockType,
  spacing: BlockSpacing | null | undefined,
  heroConfig?: Pick<HeroConfig, 'height'>,
): SectionSize {
  if (type === 'hero' && heroConfig && resolveHeroHeight(heroConfig.height) === 'fullscreen') {
    const saved = spacing ?? defaultSpacing
    const allZero =
      saved.padding_top === 0 &&
      saved.padding_right === 0 &&
      saved.padding_bottom === 0 &&
      saved.padding_left === 0
    if (allZero) return 'medium'
  }

  const saved = spacing ?? defaultSpacing
  const targetTop = saved.padding_top || mediumSpacingForType(type).padding_top

  let best: SectionSize = 'medium'
  let bestDiff = Infinity
  for (const size of ['small', 'medium', 'large'] as SectionSize[]) {
    const preset = spacingFromSize(type, size, heroConfig)
    const diff = Math.abs(preset.padding_top - targetTop)
    if (diff < bestDiff) {
      bestDiff = diff
      best = size
    }
  }
  return best
}

export function defaultSpacingSize(): SectionSize {
  return 'medium'
}

/** Footer chrome padding presets (medium matches legacy 32/24 defaults). */
export function footerSpacingFromSize(size: SectionSize): Pick<
  FooterConfig,
  'padding_top' | 'padding_right' | 'padding_bottom' | 'padding_left'
> {
  const mult = SIZE_MULTIPLIER[size]
  const side = SIDE_PADDING_BY_SIZE[size]
  const vertical = Math.round(32 * mult)
  return {
    padding_top: vertical,
    padding_right: side,
    padding_bottom: vertical,
    padding_left: side,
  }
}

/** Infer footer preset from saved numeric padding (legacy footers). */
export function inferFooterSpacingSize(
  config: Pick<FooterConfig, 'padding_top' | 'spacing_size'>,
): SectionSize {
  if (config.spacing_size === 'small' || config.spacing_size === 'medium' || config.spacing_size === 'large') {
    return config.spacing_size
  }
  const targetTop = config.padding_top ?? 32
  let best: SectionSize = 'medium'
  let bestDiff = Infinity
  for (const size of ['small', 'medium', 'large'] as SectionSize[]) {
    const preset = footerSpacingFromSize(size)
    const diff = Math.abs(preset.padding_top - targetTop)
    if (diff < bestDiff) {
      bestDiff = diff
      best = size
    }
  }
  return best
}
