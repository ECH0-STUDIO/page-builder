/**
 * Map collector English chrome labels → dashboard i18n keys.
 * Dynamic content (menu item names, category names) is returned unchanged.
 */

const FIELD_LABEL_KEYS: Record<string, string> = {
  'Meta title': 'translations.fieldLabels.Meta title',
  'Meta description': 'translations.fieldLabels.Meta description',
  Heading: 'translations.fieldLabels.Heading',
  Body: 'translations.fieldLabels.Body',
  'Button label': 'translations.fieldLabels.Button label',
  'Section heading': 'translations.fieldLabels.Section heading',
  Description: 'translations.fieldLabels.Description',
  'QR label': 'translations.fieldLabels.QR label',
  Copyright: 'translations.fieldLabels.Copyright',
  'Item name': 'translations.fieldLabels.Item name',
  'Group name': 'translations.fieldLabels.Group name',
  'Option label': 'translations.fieldLabels.Option label',
  'Option group': 'translations.fieldLabels.Option group',
  Option: 'translations.fieldLabels.Option',
}

const GROUP_KEYS: Record<string, string> = {
  SEO: 'translations.groups.SEO',
  Navbar: 'translations.groups.Navbar',
  Footer: 'translations.groups.Footer',
  Categories: 'translations.groups.Categories',
  'Promo carousel': 'translations.groups.Promo carousel',
  Items: 'translations.groups.Items',
  Variants: 'translations.groups.Variants',
}

const BLOCK_TYPE_KEYS: Record<string, string> = {
  hero: 'translations.blockTypes.hero',
  text_image: 'translations.blockTypes.text_image',
  menu_grid: 'translations.blockTypes.menu_grid',
  qr_code: 'translations.blockTypes.qr_code',
  contact: 'translations.blockTypes.contact',
  spacer: 'translations.blockTypes.spacer',
}

type TranslateFn = (key: string) => string

export function translateFieldLabel(t: TranslateFn, label: string): string {
  const key = FIELD_LABEL_KEYS[label]
  if (key) return t(key)

  const linkMatch = /^Link (\d+)$/.exec(label)
  if (linkMatch) {
    return t('translations.fieldLabels.linkN').replace('{{n}}', linkMatch[1])
  }

  const slideMatch = /^Slide (\d+) caption$/.exec(label)
  if (slideMatch) {
    return t('translations.fieldLabels.slideCaptionN').replace('{{n}}', slideMatch[1])
  }

  const descSuffix = ' · description'
  if (label.endsWith(descSuffix)) {
    const name = label.slice(0, -descSuffix.length)
    return `${name} · ${t('translations.fieldLabels.Description')}`
  }

  return label
}

export function translateFieldGroup(t: TranslateFn, group: string): string {
  const exact = GROUP_KEYS[group]
  if (exact) return t(exact)

  const optionsSuffix = ' · options'
  if (group.endsWith(optionsSuffix)) {
    const parent = group.slice(0, -optionsSuffix.length)
    const parentLabel = parent === 'Variants' ? t('translations.groups.Variants') : parent
    return `${parentLabel} · ${t('translations.groups.optionsSuffix')}`
  }

  const blockMatch = /^([a-z_]+) · (.+)$/.exec(group)
  if (blockMatch) {
    const typeKey = BLOCK_TYPE_KEYS[blockMatch[1]]
    const typeLabel = typeKey ? t(typeKey) : blockMatch[1]
    return `${typeLabel} · ${blockMatch[2]}`
  }

  return group
}

export function localizeFieldChrome(
  t: TranslateFn,
  label: string,
  group: string,
): { label: string; group: string } {
  return {
    label: translateFieldLabel(t, label),
    group: translateFieldGroup(t, group),
  }
}
