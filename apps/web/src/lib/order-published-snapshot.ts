/**
 * Order page draft vs live snapshot.
 * Autosave writes the draft columns. The public order page reads `published_order`
 * until the owner publishes, matching the landing page's published_blocks flow.
 */

export type OrderPublishedSnapshot = {
  order_background_color: string | null
  order_background_image_url: string | null
  order_promo_slides: unknown
  order_carousel_aspect_desktop: unknown
  order_carousel_aspect_mobile: unknown
  order_menu_config: unknown
}

const SNAPSHOT_KEYS: (keyof OrderPublishedSnapshot)[] = [
  'order_background_color',
  'order_background_image_url',
  'order_promo_slides',
  'order_carousel_aspect_desktop',
  'order_carousel_aspect_mobile',
  'order_menu_config',
]

export function isOrderPublishedSnapshot(value: unknown): value is OrderPublishedSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  return SNAPSHOT_KEYS.every((key) => key in (value as object))
}

export function orderSnapshotFromRow(
  row: Record<string, unknown> | null | undefined,
): OrderPublishedSnapshot {
  const source = row ?? {}
  return {
    order_background_color:
      typeof source.order_background_color === 'string' ? source.order_background_color : null,
    order_background_image_url:
      typeof source.order_background_image_url === 'string'
        ? source.order_background_image_url
        : null,
    order_promo_slides: source.order_promo_slides ?? [],
    order_carousel_aspect_desktop: source.order_carousel_aspect_desktop ?? '16/9',
    order_carousel_aspect_mobile: source.order_carousel_aspect_mobile ?? 'same',
    order_menu_config: source.order_menu_config ?? null,
  }
}

/** Live order page fields. Prefer the last publish snapshot over the editor draft. */
export function resolveLiveOrderConfig<T extends Record<string, unknown>>(
  pub: T | null | undefined,
): T {
  if (!pub) return {} as T
  const snap = pub.published_order
  if (!isOrderPublishedSnapshot(snap)) return pub
  return { ...pub, ...snap }
}
