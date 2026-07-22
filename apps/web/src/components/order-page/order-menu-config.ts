/**
 * Order-page menu config helpers.
 * Stored as jsonb on publishing_settings.order_menu_config.
 */

import {
  defaultMenuGridConfig,
  type MenuGridConfig,
} from '@/components/page-builder/types'

export function normalizeOrderMenuConfig(raw: unknown): MenuGridConfig | null {
  if (raw == null) return null
  if (typeof raw !== 'object' || Array.isArray(raw)) return null
  const row = raw as Record<string, unknown>

  const layout = row.layout === '2col' || row.layout === '3col' || row.layout === 'list'
    ? row.layout
    : defaultMenuGridConfig.layout

  const selection_mode = row.selection_mode === 'custom_items' ? 'custom_items' : 'category'
  const tabs_layout = row.tabs_layout === 'horizontal' ? 'horizontal' : 'sidebar'

  const category_ids = Array.isArray(row.category_ids)
    ? row.category_ids.filter((id): id is string => typeof id === 'string')
    : []
  const item_ids = Array.isArray(row.item_ids)
    ? row.item_ids.filter((id): id is string => typeof id === 'string')
    : []

  return {
    ...defaultMenuGridConfig,
    layout,
    selection_mode,
    tabs_layout,
    category_ids,
    item_ids,
    show_image: row.show_image !== false,
    show_description: row.show_description !== false,
    show_price: row.show_price !== false,
    show_unavailable_badge: row.show_unavailable_badge !== false,
    show_category_tabs: row.show_category_tabs !== false,
    heading: typeof row.heading === 'string' ? row.heading : '',
    description: typeof row.description === 'string' ? row.description : '',
    background_color: typeof row.background_color === 'string'
      ? row.background_color
      : defaultMenuGridConfig.background_color,
    text_color: typeof row.text_color === 'string'
      ? row.text_color
      : defaultMenuGridConfig.text_color,
    pagination_enabled: Boolean(row.pagination_enabled),
    items_per_page: typeof row.items_per_page === 'number' && row.items_per_page > 0
      ? Math.min(Math.floor(row.items_per_page), 100)
      : defaultMenuGridConfig.items_per_page,
  }
}

/** Resolve the MenuGridConfig used on the live order page. */
export function resolveOrderMenuConfig(opts: {
  configured: MenuGridConfig | null
  landingMenuGrid?: MenuGridConfig | null
}): MenuGridConfig {
  const base = opts.configured
    ? { ...opts.configured }
    : opts.landingMenuGrid
      ? {
          ...defaultMenuGridConfig,
          ...opts.landingMenuGrid,
          heading: '',
          description: '',
        }
      : { ...defaultMenuGridConfig }

  // Order page always shows all visible menu categories/items.
  // Hide dishes/categories from the Menu dashboard tab, not here.
  return {
    ...base,
    selection_mode: 'category',
    category_ids: [],
    item_ids: [],
  }
}
