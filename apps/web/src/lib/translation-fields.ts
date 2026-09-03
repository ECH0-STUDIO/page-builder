/**
 * Collect and describe every storefront string that can be translated.
 */

import type { PageBlock, HeroConfig, TextImageConfig, MenuGridConfig, QRCodeConfig, NavbarConfig, FooterConfig, CtaButton } from '@/components/page-builder/types'
import type { OrderPromoSlide } from '@/components/order-page/promo-slides'
import {
  isLocaleCustomized,
  readLocaleText,
  type LocalizedString,
} from '@/i18n/localized-content'
import type { StoreLocaleCode } from '@/i18n/store-locales'

export type TranslationSectionId = 'seo' | 'page' | 'menu' | 'order' | 'chrome'

export type TranslationField = {
  /** Stable id used when saving — e.g. menu.item.{id}.name */
  id: string
  section: TranslationSectionId
  /** Group heading within a section */
  group: string
  label: string
  primaryText: string
  translatedText: string
  customized: boolean
  multiline?: boolean
}

function asLocalized(value: unknown): LocalizedString {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as LocalizedString
  }
  return ''
}

function fieldFromValue(
  id: string,
  section: TranslationSectionId,
  group: string,
  label: string,
  value: unknown,
  locale: string,
  primary: string,
  multiline?: boolean,
): TranslationField | null {
  const localized = asLocalized(value)
  const primaryText = readLocaleText(localized, primary, primary)
  if (!primaryText.trim()) return null
  return {
    id,
    section,
    group,
    label,
    primaryText,
    translatedText: readLocaleText(localized, locale, primary),
    customized: isLocaleCustomized(localized, locale, primary),
    multiline,
  }
}

function ctaFields(
  prefix: string,
  section: TranslationSectionId,
  group: string,
  cta: CtaButton | null | undefined,
  locale: string,
  primary: string,
): TranslationField[] {
  if (!cta) return []
  const f = fieldFromValue(`${prefix}.label`, section, group, 'Button label', cta.label, locale, primary)
  return f ? [f] : []
}

export function collectPageBlockFields(
  blocks: PageBlock[],
  locale: string,
  primary: string,
): TranslationField[] {
  const out: TranslationField[] = []
  for (const block of blocks) {
    const group = `${block.type} · ${block.block_anchor_id || block.id.slice(0, 8)}`
    const cfg = block.config as Record<string, unknown>

    if (block.type === 'hero') {
      const c = cfg as unknown as HeroConfig
      for (const f of [
        fieldFromValue(`page.block.${block.id}.heading`, 'page', group, 'Heading', c.heading, locale, primary),
        fieldFromValue(`page.block.${block.id}.body`, 'page', group, 'Body', c.body, locale, primary, true),
      ]) if (f) out.push(f)
      out.push(...ctaFields(`page.block.${block.id}.cta`, 'page', group, c.cta, locale, primary))
      out.push(...ctaFields(`page.block.${block.id}.cta_secondary`, 'page', group, c.cta_secondary, locale, primary))
    }

    if (block.type === 'text_image') {
      const c = cfg as unknown as TextImageConfig
      for (const f of [
        fieldFromValue(`page.block.${block.id}.heading`, 'page', group, 'Heading', c.heading, locale, primary),
        fieldFromValue(`page.block.${block.id}.body`, 'page', group, 'Body', c.body, locale, primary, true),
      ]) if (f) out.push(f)
      out.push(...ctaFields(`page.block.${block.id}.cta`, 'page', group, c.cta, locale, primary))
    }

    if (block.type === 'menu_grid') {
      const c = cfg as unknown as MenuGridConfig
      for (const f of [
        fieldFromValue(`page.block.${block.id}.heading`, 'page', group, 'Section heading', c.heading, locale, primary),
        fieldFromValue(`page.block.${block.id}.description`, 'page', group, 'Description', c.description, locale, primary, true),
      ]) if (f) out.push(f)
    }

    if (block.type === 'qr_code') {
      const c = cfg as unknown as QRCodeConfig
      const f = fieldFromValue(`page.block.${block.id}.label`, 'page', group, 'QR label', c.label, locale, primary)
      if (f) out.push(f)
    }
  }
  return out
}

export function collectChromeFields(
  navbar: NavbarConfig | null | undefined,
  footer: FooterConfig | null | undefined,
  locale: string,
  primary: string,
): TranslationField[] {
  const out: TranslationField[] = []
  const links = navbar?.links ?? []
  links.forEach((link, i) => {
    const f = fieldFromValue(
      `chrome.navbar.link.${i}.label`,
      'chrome',
      'Navbar',
      `Link ${i + 1}`,
      link.label,
      locale,
      primary,
    )
    if (f) out.push(f)
  })
  const copy = fieldFromValue(
    'chrome.footer.copyright_text',
    'chrome',
    'Footer',
    'Copyright',
    footer?.copyright_text,
    locale,
    primary,
  )
  if (copy) out.push(copy)
  return out
}

export function collectSeoFields(
  seo: { seo_title?: string | null; seo_description?: string | null; seo_i18n?: unknown },
  locale: string,
  primary: string,
): TranslationField[] {
  const map = (seo.seo_i18n && typeof seo.seo_i18n === 'object' && !Array.isArray(seo.seo_i18n))
    ? seo.seo_i18n as Record<string, unknown>
    : null

  const titleSource = map?.title ?? seo.seo_title ?? ''
  const descSource = map?.description ?? seo.seo_description ?? ''

  const out: TranslationField[] = []
  const title = fieldFromValue('seo.title', 'seo', 'SEO', 'Meta title', titleSource, locale, primary)
  const desc = fieldFromValue('seo.description', 'seo', 'SEO', 'Meta description', descSource, locale, primary, true)
  if (title) out.push(title)
  if (desc) out.push(desc)
  return out
}

export function collectOrderPromoFields(
  slides: OrderPromoSlide[],
  locale: string,
  primary: string,
): TranslationField[] {
  const out: TranslationField[] = []
  slides.forEach((slide, i) => {
    // alt may become localized map later; for now treat string as primary
    const f = fieldFromValue(
      `order.promo.${slide.id}.alt`,
      'order',
      'Promo carousel',
      `Slide ${i + 1} caption`,
      (slide as { alt?: unknown; alt_i18n?: unknown }).alt_i18n ?? slide.alt,
      locale,
      primary,
    )
    if (f) out.push(f)
  })
  return out
}

export type MenuCollectInput = {
  categories: { id: string; name: string; name_i18n?: unknown }[]
  items: { id: string; name: string; description: string | null; name_i18n?: unknown; description_i18n?: unknown; category_id: string }[]
  variantGroups: { id: string; item_id: string; name: string; name_i18n?: unknown }[]
  variantOptions: { id: string; group_id: string; label: string; label_i18n?: unknown }[]
}

export function collectMenuFields(
  data: MenuCollectInput,
  locale: string,
  primary: string,
): TranslationField[] {
  const out: TranslationField[] = []
  const catName = new Map(data.categories.map(c => [c.id, c.name]))

  for (const cat of data.categories) {
    const f = fieldFromValue(
      `menu.category.${cat.id}.name`,
      'menu',
      'Categories',
      cat.name || 'Category',
      cat.name_i18n ?? cat.name,
      locale,
      primary,
    )
    if (f) out.push(f)
  }

  for (const item of data.items) {
    const group = catName.get(item.category_id) || 'Items'
    const name = fieldFromValue(
      `menu.item.${item.id}.name`,
      'menu',
      group,
      'Item name',
      item.name_i18n ?? item.name,
      locale,
      primary,
    )
    const desc = fieldFromValue(
      `menu.item.${item.id}.description`,
      'menu',
      group,
      `${item.name} · description`,
      item.description_i18n ?? item.description,
      locale,
      primary,
      true,
    )
    if (name) out.push(name)
    if (desc) out.push(desc)
  }

  const itemName = new Map(data.items.map(i => [i.id, i.name]))
  for (const group of data.variantGroups) {
    const parent = itemName.get(group.item_id) || 'Variants'
    const f = fieldFromValue(
      `menu.variantGroup.${group.id}.name`,
      'menu',
      `${parent} · options`,
      'Option group',
      group.name_i18n ?? group.name,
      locale,
      primary,
    )
    if (f) out.push(f)
  }

  const groupName = new Map(data.variantGroups.map(g => [g.id, g.name]))
  for (const opt of data.variantOptions) {
    const parent = groupName.get(opt.group_id) || 'Option'
    const f = fieldFromValue(
      `menu.variantOption.${opt.id}.label`,
      'menu',
      parent,
      'Option',
      opt.label_i18n ?? opt.label,
      locale,
      primary,
    )
    if (f) out.push(f)
  }

  return out
}

export const SECTION_LABELS: Record<TranslationSectionId, string> = {
  seo: 'SEO & social',
  page: 'Landing page',
  chrome: 'Navbar & footer',
  menu: 'Menu',
  order: 'Order page',
}

export function emptyTranslationCount(fields: TranslationField[], locale: string, primary: string): number {
  return fields.filter(f => !f.customized && locale !== primary).length
}
