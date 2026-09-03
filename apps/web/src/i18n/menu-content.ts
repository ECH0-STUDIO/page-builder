import type { MenuCategory, MenuItem, VariantGroup, VariantOption } from '@/app/actions/menu'
import { readLocaleText, type LocalizedString } from '@/i18n/localized-content'

export function normalizeMenuCategory(row: Record<string, unknown>): MenuCategory {
  return {
    ...(row as MenuCategory),
    name_i18n: (row.name_i18n as MenuCategory['name_i18n']) ?? null,
  }
}

export function normalizeMenuItem(row: Record<string, unknown>): MenuItem {
  return {
    ...(row as MenuItem),
    is_vegetarian: Boolean(row.is_vegetarian),
    spicy_level: typeof row.spicy_level === 'number' ? row.spicy_level : Number(row.spicy_level) || 0,
    is_featured: Boolean(row.is_featured),
    name_i18n: (row.name_i18n as MenuItem['name_i18n']) ?? null,
    description_i18n: (row.description_i18n as MenuItem['description_i18n']) ?? null,
  }
}

export function normalizeMenuCategories(rows: Record<string, unknown>[]): MenuCategory[] {
  return rows.map(normalizeMenuCategory)
}

export function normalizeMenuItems(rows: Record<string, unknown>[]): MenuItem[] {
  return rows.map(normalizeMenuItem)
}

function asLocalized(value: unknown): LocalizedString {
  return value as LocalizedString
}

export function menuCategoryName(cat: MenuCategory, locale: string, primary: string): string {
  return readLocaleText(asLocalized(cat.name_i18n ?? cat.name), locale, primary) || cat.name
}

export function menuItemName(item: MenuItem, locale: string, primary: string): string {
  return readLocaleText(asLocalized(item.name_i18n ?? item.name), locale, primary) || item.name
}

export function menuItemDescription(item: MenuItem, locale: string, primary: string): string {
  return readLocaleText(asLocalized(item.description_i18n ?? item.description), locale, primary)
}

export function variantGroupName(group: VariantGroup, locale: string, primary: string): string {
  return readLocaleText(asLocalized(group.name_i18n ?? group.name), locale, primary) || group.name
}

export function variantOptionLabel(option: VariantOption, locale: string, primary: string): string {
  return readLocaleText(asLocalized(option.label_i18n ?? option.label), locale, primary) || option.label
}

export function normalizeVariantGroup(row: Record<string, unknown>): VariantGroup {
  return {
    ...(row as VariantGroup),
    name_i18n: (row.name_i18n as VariantGroup['name_i18n']) ?? null,
  }
}

export function normalizeVariantOption(row: Record<string, unknown>): VariantOption {
  return {
    ...(row as VariantOption),
    label_i18n: (row.label_i18n as VariantOption['label_i18n']) ?? null,
  }
}

export function normalizeVariantGroups(rows: Record<string, unknown>[]): VariantGroup[] {
  return rows.map(normalizeVariantGroup)
}

export function normalizeVariantOptions(rows: Record<string, unknown>[]): VariantOption[] {
  return rows.map(normalizeVariantOption)
}

/** Resolve menu strings for a content locale (primary fallback). */
export function localizeMenuForLocale(
  data: {
    categories: MenuCategory[]
    items: MenuItem[]
    variantGroups: VariantGroup[]
    variantOptions: VariantOption[]
  },
  locale: string,
  primary: string,
) {
  return {
    categories: data.categories.map(cat => ({
      ...cat,
      name: menuCategoryName(cat, locale, primary),
    })),
    items: data.items.map(item => ({
      ...item,
      name: menuItemName(item, locale, primary),
      description: menuItemDescription(item, locale, primary) || null,
    })),
    variantGroups: data.variantGroups.map(group => ({
      ...group,
      name: variantGroupName(group, locale, primary),
    })),
    variantOptions: data.variantOptions.map(option => ({
      ...option,
      label: variantOptionLabel(option, locale, primary),
    })),
  }
}
