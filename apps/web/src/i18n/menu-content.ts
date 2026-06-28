import type { MenuCategory, MenuItem } from '@/app/actions/menu'
import { isVisibleInLocale, pickLocale, type SupportedLocale } from '@/i18n/locale'

export type MenuI18nMap = Partial<Record<string, string>>

export function normalizeMenuI18n(value: unknown): MenuI18nMap | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const vi = typeof record.vi === 'string' ? record.vi : undefined
  const en = typeof record.en === 'string' ? record.en : undefined
  if (!vi && !en) return null
  return { vi, en }
}

export function normalizeMenuCategory(row: Record<string, unknown>): MenuCategory {
  return {
    ...(row as MenuCategory),
    name_i18n: normalizeMenuI18n(row.name_i18n),
    visible_locales: Array.isArray(row.visible_locales) ? row.visible_locales as string[] : null,
  }
}

export function normalizeMenuItem(row: Record<string, unknown>): MenuItem {
  return {
    ...(row as MenuItem),
    name_i18n: normalizeMenuI18n(row.name_i18n),
    description_i18n: normalizeMenuI18n(row.description_i18n),
    visible_locales: Array.isArray(row.visible_locales) ? row.visible_locales as string[] : null,
  }
}

export function getMenuItemName(item: MenuItem, locale: SupportedLocale): string {
  return pickLocale(item.name_i18n ?? item.name, locale) || item.name
}

export function getMenuItemDescription(item: MenuItem, locale: SupportedLocale): string | null {
  const desc = pickLocale(item.description_i18n ?? item.description, locale)
  return desc || item.description || null
}

export function getCategoryName(category: MenuCategory, locale: SupportedLocale): string {
  return pickLocale(category.name_i18n ?? category.name, locale) || category.name
}

export function normalizeMenuCategories(rows: Record<string, unknown>[]): MenuCategory[] {
  return rows.map(normalizeMenuCategory)
}

export function normalizeMenuItems(rows: Record<string, unknown>[]): MenuItem[] {
  return rows.map(normalizeMenuItem)
}

/** Shallow copy with resolved name/description for rendering one locale. */
export function localizeMenuItems(
  items: MenuItem[],
  locale: SupportedLocale,
  enabledLocales: string[] = ['vi', 'en'],
): MenuItem[] {
  return items
    .filter(item => isVisibleInLocale(item.visible_locales, locale))
    .map(item => ({
      ...item,
      name: getMenuItemName(item, locale),
      description: getMenuItemDescription(item, locale),
    }))
}

export function localizeMenuCategories(
  categories: MenuCategory[],
  locale: SupportedLocale,
  enabledLocales: string[] = ['vi', 'en'],
): MenuCategory[] {
  return categories
    .filter(cat => isVisibleInLocale(cat.visible_locales, locale))
    .map(cat => ({
      ...cat,
      name: getCategoryName(cat, locale),
    }))
}
