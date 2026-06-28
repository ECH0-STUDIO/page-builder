import type { MenuCategory, MenuItem } from '@/app/actions/menu'

export function normalizeMenuCategory(row: Record<string, unknown>): MenuCategory {
  return row as MenuCategory
}

export function normalizeMenuItem(row: Record<string, unknown>): MenuItem {
  return row as MenuItem
}

export function normalizeMenuCategories(rows: Record<string, unknown>[]): MenuCategory[] {
  return rows.map(normalizeMenuCategory)
}

export function normalizeMenuItems(rows: Record<string, unknown>[]): MenuItem[] {
  return rows.map(normalizeMenuItem)
}
