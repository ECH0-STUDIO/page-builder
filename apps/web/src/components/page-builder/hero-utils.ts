/**
 * Hero block helpers — height normalization and spacing defaults.
 */

import type { BlockSpacing, HeroConfig } from './types'
import { defaultSpacing, BLOCK_DEFAULT_SPACING } from './types'

export type ResolvedHeroHeight = 'custom' | 'fullscreen'

/** Normalize saved height values (legacy medium/auto → custom). */
export function resolveHeroHeight(height: string | undefined): ResolvedHeroHeight {
  if (height === 'fullscreen') return 'fullscreen'
  return 'custom'
}

/** Shell spacing defaults for a hero based on its height mode. */
export function getHeroSpacingDefaults(height: ResolvedHeroHeight): BlockSpacing {
  if (height === 'fullscreen') return { ...defaultSpacing }
  return { ...(BLOCK_DEFAULT_SPACING.hero ?? defaultSpacing) }
}

export function heroHeightFromConfig(config: Pick<HeroConfig, 'height'>): ResolvedHeroHeight {
  return resolveHeroHeight(config.height)
}
