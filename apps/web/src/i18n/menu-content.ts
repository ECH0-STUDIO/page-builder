import type { MenuCategory, MenuItem } from '@/app/actions/menu'

export function normalizeMenuCategory(row: Record<string, unknown>): MenuCategory {
  return row as MenuCategory
}

export function normalizeMenuItem(row: Record<string, unknown>): MenuItem {
  return {
    ...(row as MenuItem),
    is_vegetarian: Boolean(row.is_vegetarian),
    spicy_level: typeof row.spicy_level === 'number' ? row.spicy_level : Number(row.spicy_level) || 0,
    is_featured: Boolean(row.is_featured),
  }
}

export function normalizeMenuCategories(rows: Record<string, unknown>[]): MenuCategory[] {
  return rows.map(normalizeMenuCategory)
}

export function normalizeMenuItems(rows: Record<string, unknown>[]): MenuItem[] {
  return rows.map(normalizeMenuItem)
}
