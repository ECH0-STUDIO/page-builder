/**
 * One-time backfill when a business enables dual language.
 * Copies primary text into secondary baselines across menu, pages, theme, SEO.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { SupportedLocale } from '@/i18n/locale'
import { baseLocaleMap } from '@/i18n/editor-locale-utils'
import { otherStoreLocale, readLocaleText } from '@/i18n/localized-content'
import type { BlockType } from '@/components/page-builder/types'

export type DualLanguageSetupStep =
  | 'menu'
  | 'variants'
  | 'pages'
  | 'order_promo'
  | 'theme'
  | 'seo'

export type DualLanguageSetupResult = {
  ok: boolean
  steps: { id: DualLanguageSetupStep; label: string }[]
  error?: string
}

function localizeField(
  value: unknown,
  primary: SupportedLocale,
  secondary: SupportedLocale,
): Record<string, string> {
  return baseLocaleMap(value as string | Record<string, string> | null, primary, secondary)
}

function migrateCtaLabel(
  cta: unknown,
  primary: SupportedLocale,
  secondary: SupportedLocale,
): Record<string, unknown> | null {
  if (!cta || typeof cta !== 'object') return null
  const row = { ...(cta as Record<string, unknown>) }
  if (typeof row.label === 'string' || (row.label && typeof row.label === 'object')) {
    row.label = localizeField(row.label, primary, secondary)
  }
  return row
}

function migrateBlockConfig(
  type: string,
  config: Record<string, unknown>,
  primary: SupportedLocale,
  secondary: SupportedLocale,
): Record<string, unknown> {
  const out = { ...config }

  const textFieldsByType: Record<string, string[]> = {
    hero: ['heading', 'body', 'tagline'],
    text_image: ['heading', 'body'],
    menu_grid: ['heading', 'description'],
    qr_code: ['label'],
    contact: [],
  }

  for (const key of textFieldsByType[type as BlockType] ?? []) {
    if (key in out) {
      out[key] = localizeField(out[key], primary, secondary)
    }
  }

  if (out.cta) {
    const migrated = migrateCtaLabel(out.cta, primary, secondary)
    if (migrated) out.cta = migrated
  }
  if (out.cta_secondary) {
    const migrated = migrateCtaLabel(out.cta_secondary, primary, secondary)
    if (migrated) out.cta_secondary = migrated
  }

  return out
}

function migrateNavbarConfig(
  raw: unknown,
  primary: SupportedLocale,
  secondary: SupportedLocale,
): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null
  const config = { ...(raw as Record<string, unknown>) }
  if (Array.isArray(config.links)) {
    config.links = config.links.map((link) => {
      if (!link || typeof link !== 'object') return link
      const row = { ...(link as Record<string, unknown>) }
      if ('label' in row) {
        row.label = localizeField(row.label, primary, secondary)
      }
      return row
    })
  }
  return config
}

function migrateFooterConfig(
  raw: unknown,
  primary: SupportedLocale,
  secondary: SupportedLocale,
): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null
  const config = { ...(raw as Record<string, unknown>) }
  if ('copyright_text' in config) {
    config.copyright_text = localizeField(config.copyright_text, primary, secondary)
  }
  return config
}

function migratePromoSlides(
  raw: unknown,
  primary: SupportedLocale,
  secondary: SupportedLocale,
): unknown {
  if (!Array.isArray(raw)) return raw
  return raw.map((slide) => {
    if (!slide || typeof slide !== 'object') return slide
    const row = { ...(slide as Record<string, unknown>) }
    if ('alt' in row) {
      row.alt = localizeField(row.alt, primary, secondary)
    }
    return row
  })
}

function migrateBlockList(
  blocks: unknown,
  primary: SupportedLocale,
  secondary: SupportedLocale,
): unknown {
  if (!Array.isArray(blocks)) return blocks
  return blocks.map((block) => {
    if (!block || typeof block !== 'object') return block
    const row = { ...(block as Record<string, unknown>) }
    const type = typeof row.type === 'string' ? row.type : ''
    if (row.config && typeof row.config === 'object') {
      row.config = migrateBlockConfig(
        type,
        row.config as Record<string, unknown>,
        primary,
        secondary,
      )
    }
    return row
  })
}

export async function runDualLanguageSetup(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: SupabaseClient<any>,
  businessId: string,
  primary: SupportedLocale,
): Promise<DualLanguageSetupResult> {
  const secondary = otherStoreLocale(primary)
  const steps: { id: DualLanguageSetupStep; label: string }[] = [
    { id: 'menu', label: 'Menu' },
    { id: 'variants', label: 'Variants' },
    { id: 'pages', label: 'Pages' },
    { id: 'order_promo', label: 'Order page' },
    { id: 'theme', label: 'Theme' },
    { id: 'seo', label: 'SEO' },
  ]

  try {
    const { data: categories } = await db
      .from('menu_categories')
      .select('id, name, name_i18n')
      .eq('business_id', businessId)

    for (const cat of categories ?? []) {
      const nameText = readLocaleText(cat.name_i18n ?? cat.name, primary, primary) || cat.name
      await db
        .from('menu_categories')
        .update({
          name_i18n: { [primary]: nameText, [secondary]: nameText },
        })
        .eq('id', cat.id)
    }

    const { data: items } = await db
      .from('menu_items')
      .select('id, name, description, name_i18n, description_i18n')
      .eq('business_id', businessId)

    for (const item of items ?? []) {
      const nameText = readLocaleText(item.name_i18n ?? item.name, primary, primary) || item.name
      const descSource = item.description_i18n ?? item.description
      const descText = descSource
        ? readLocaleText(descSource, primary, primary) || (item.description ?? '')
        : ''
      await db
        .from('menu_items')
        .update({
          name_i18n: { [primary]: nameText, [secondary]: nameText },
          description_i18n: descText
            ? { [primary]: descText, [secondary]: descText }
            : null,
        })
        .eq('id', item.id)
    }

    const itemIds = (items ?? []).map((i) => i.id)
    if (itemIds.length > 0) {
      const { data: groups } = await db
        .from('menu_item_variant_groups')
        .select('id, name, name_i18n')
        .in('item_id', itemIds)

      for (const group of groups ?? []) {
        const nameText = readLocaleText(group.name_i18n ?? group.name, primary, primary) || group.name
        await db
          .from('menu_item_variant_groups')
          .update({ name_i18n: { [primary]: nameText, [secondary]: nameText } })
          .eq('id', group.id)
      }

      const groupIds = (groups ?? []).map((g) => g.id)
      if (groupIds.length > 0) {
        const { data: options } = await db
          .from('menu_item_variant_options')
          .select('id, label, label_i18n')
          .in('group_id', groupIds)

        for (const opt of options ?? []) {
          const labelText =
            readLocaleText(opt.label_i18n ?? opt.label, primary, primary) || opt.label
          await db
            .from('menu_item_variant_options')
            .update({ label_i18n: { [primary]: labelText, [secondary]: labelText } })
            .eq('id', opt.id)
        }
      }
    }

    const { data: pageBlocks } = await db
      .from('page_blocks')
      .select('id, type, config')
      .eq('business_id', businessId)

    for (const block of pageBlocks ?? []) {
      if (!block.config || typeof block.config !== 'object') continue
      const migrated = migrateBlockConfig(
        block.type,
        block.config as Record<string, unknown>,
        primary,
        secondary,
      )
      await db.from('page_blocks').update({ config: migrated }).eq('id', block.id)
    }

    const { data: pub } = await db
      .from('publishing_settings')
      .select(
        'published_blocks, order_promo_slides, seo_title, seo_description, seo_i18n',
      )
      .eq('business_id', businessId)
      .single()

    const pubPatch: Record<string, unknown> = {}

    if (pub?.published_blocks) {
      pubPatch.published_blocks = migrateBlockList(pub.published_blocks, primary, secondary)
    }
    if (pub?.order_promo_slides) {
      pubPatch.order_promo_slides = migratePromoSlides(
        pub.order_promo_slides,
        primary,
        secondary,
      )
    }

    const seoTitle = typeof pub?.seo_title === 'string' ? pub.seo_title : ''
    const seoDesc = typeof pub?.seo_description === 'string' ? pub.seo_description : ''
    pubPatch.seo_i18n = {
      [primary]: {
        title: seoTitle,
        description: seoDesc,
      },
      [secondary]: {
        title: seoTitle,
        description: seoDesc,
      },
    }

    if (Object.keys(pubPatch).length > 0) {
      await db.from('publishing_settings').update(pubPatch).eq('business_id', businessId)
    }

    const { data: theme } = await db
      .from('theme_settings')
      .select('id, navbar_config, footer_config')
      .eq('business_id', businessId)
      .maybeSingle()

    if (theme) {
      const themePatch: Record<string, unknown> = {}
      const nav = migrateNavbarConfig(theme.navbar_config, primary, secondary)
      const foot = migrateFooterConfig(theme.footer_config, primary, secondary)
      if (nav) themePatch.navbar_config = nav
      if (foot) themePatch.footer_config = foot
      if (Object.keys(themePatch).length > 0) {
        await db.from('theme_settings').update(themePatch).eq('id', theme.id)
      }
    }

    return { ok: true, steps }
  } catch (err) {
    return {
      ok: false,
      steps,
      error: err instanceof Error ? err.message : 'Dual language setup failed',
    }
  }
}
