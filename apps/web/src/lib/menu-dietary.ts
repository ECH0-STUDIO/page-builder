/**
 * Shared dietary badge helpers for menu cards / item modal.
 */

export type SpicyLevel = 0 | 1 | 2 | 3

export function clampSpicyLevel(value: unknown): SpicyLevel {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n <= 0) return 0
  if (n >= 3) return 3
  return Math.floor(n) as SpicyLevel
}

export function spicyLabelKey(level: SpicyLevel): string | null {
  if (level <= 0) return null
  if (level === 1) return 'menuBuilder.spicyMild'
  if (level === 2) return 'menuBuilder.spicyMedium'
  return 'menuBuilder.spicyHot'
}

/** Chili emoji string for a level (empty if none). */
export function spicyChiliText(level: SpicyLevel): string {
  if (level <= 0) return ''
  return '🌶️'.repeat(level)
}
