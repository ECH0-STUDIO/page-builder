import type { MenuCategory, MenuItem, VariantGroup, VariantOption } from '@/app/actions/menu'
import type { SupportedLocale } from '@/i18n/locale'
import { readEditorLocaleText } from '@/i18n/editor-locale-utils'
import { readLocaleText, type LocalizedString } from '@/i18n/localized-content'

function asLocalized(value: unknown): LocalizedString {
  return value as LocalizedString
}

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
  return readLocaleText(asLocalized(cat.name_i18n ?? cat.name), locale, primary) || cat.name
}

/** Editor-only: no cross-locale fallback so tabs stay independent. */
export function menuCategoryNameEditor(
  cat: MenuCategory,
  locale: SupportedLocale,
  primary: SupportedLocale,
): string {
  const text = readEditorLocaleText(asLocalized(cat.name_i18n ?? cat.name), locale, primary)
  return text || (locale === primary ? cat.name : '')
}

export function menuItemName(
  item: MenuItem,
  locale: SupportedLocale,
  primary: SupportedLocale,
): string {
  return readLocaleText(asLocalized(item.name_i18n ?? item.name), locale, primary) || item.name
}

/** Editor-only: no cross-locale fallback so tabs stay independent. */
export function menuItemNameEditor(
  item: MenuItem,
  locale: SupportedLocale,
  primary: SupportedLocale,
): string {
  const text = readEditorLocaleText(asLocalized(item.name_i18n ?? item.name), locale, primary)
  return text || (locale === primary ? item.name : '')
}

export function menuItemDescription(
  item: MenuItem,
  locale: SupportedLocale,
  primary: SupportedLocale,
): string {
  const source = asLocalized(item.description_i18n ?? item.description)
  return readLocaleText(source, locale, primary)
}

/** Editor-only: no cross-locale fallback so tabs stay independent. */
export function menuItemDescriptionEditor(
  item: MenuItem,
  locale: SupportedLocale,
  primary: SupportedLocale,
): string {
  const source = asLocalized(item.description_i18n ?? item.description)
  return readEditorLocaleText(source, locale, primary)
}

export function variantGroupName(
  group: VariantGroup,
  locale: SupportedLocale,
  primary: SupportedLocale,
): string {
  return readLocaleText(asLocalized(group.name_i18n ?? group.name), locale, primary) || group.name
}

export function variantOptionLabel(
  option: VariantOption,
  locale: SupportedLocale,
  primary: SupportedLocale,
): string {
  return readLocaleText(asLocalized(option.label_i18n ?? option.label), locale, primary) || option.label
}

export function normalizeVariantGroup(row: Record<string, unknown>): VariantGroup {
  return {
    ...(row as VariantGroup),
    name_i18n: (row.name_i18n as Record<string, string> | null) ?? null,
  }
}

export function normalizeVariantOption(row: Record<string, unknown>): VariantOption {
  return {
    ...(row as VariantOption),
    label_i18n: (row.label_i18n as Record<string, string> | null) ?? null,
  }
}

export function normalizeVariantGroups(rows: Record<string, unknown>[]): VariantGroup[] {
  return rows.map(normalizeVariantGroup)
}

export function normalizeVariantOptions(rows: Record<string, unknown>[]): VariantOption[] {
  return rows.map(normalizeVariantOption)
}
