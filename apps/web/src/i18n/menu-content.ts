import type { MenuCategory, MenuItem, VariantGroup, VariantOption } from '@/app/actions/menu'
import type { SupportedLocale } from '@/i18n/locale'
import { readLocaleText, type LocalizedString } from '@/i18n/localized-content'

export function normalizeMenuCategory(row: Record<string, unknown>): MenuCategory {
  return {
    ...(row as MenuCategory),
    name_i18n: (row.name_i18n as Record<string, string> | null) ?? null,
  }
}

export function normalizeMenuItem(row: Record<string, unknown>): MenuItem {
  return {
    ...(row as MenuItem),
    is_vegetarian: Boolean(row.is_vegetarian),
    spicy_level: typeof row.spicy_level === 'number' ? row.spicy_level : Number(row.spicy_level) || 0,
    is_featured: Boolean(row.is_featured),
    name_i18n: (row.name_i18n as Record<string, string> | null) ?? null,
    description_i18n: (row.description_i18n as Record<string, string> | null) ?? null,
  }
}

export function normalizeMenuCategories(rows: Record<string, unknown>[]): MenuCategory[] {
  return rows.map(normalizeMenuCategory)
}

export function normalizeMenuItems(rows: Record<string, unknown>[]): MenuItem[] {
  return rows.map(normalizeMenuItem)
}

export function menuCategoryName(
  cat: MenuCategory,
  locale: SupportedLocale,
  primary: SupportedLocale,
): string {
  return readLocaleText(cat.name_i18n ?? cat.name, locale, primary) || cat.name
}

export function menuItemName(
  item: MenuItem,
  locale: SupportedLocale,
  primary: SupportedLocale,
): string {
  return readLocaleText(item.name_i18n ?? item.name, locale, primary) || item.name
}

export function menuItemDescription(
  item: MenuItem,
  locale: SupportedLocale,
  primary: SupportedLocale,
): string {
  const source: LocalizedString = item.description_i18n ?? item.description
  return readLocaleText(source, locale, primary)
}

export function variantGroupName(
  group: VariantGroup,
  locale: SupportedLocale,
  primary: SupportedLocale,
): string {
  return readLocaleText(group.name_i18n ?? group.name, locale, primary) || group.name
}

export function variantOptionLabel(
  option: VariantOption,
  locale: SupportedLocale,
  primary: SupportedLocale,
): string {
  return readLocaleText(option.label_i18n ?? option.label, locale, primary) || option.label
}
