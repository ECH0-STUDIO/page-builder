'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { assertOwnerOrManager } from '@/lib/business-auth'
import { getActiveBusinessLocales, getBusinessPrimaryLocale } from '@/app/actions/business-locales'
import { isStoreLocaleCode, type StoreLocaleCode } from '@/i18n/store-locales'
import {
  applyLocaleChange,
  primaryPlainText,
  setPrimaryLocaleText,
  syncLocalizedConfig,
  type LocalizedString,
} from '@/i18n/localized-content'
import {
  collectChromeFields,
  collectMenuFields,
  collectOrderPromoFields,
  collectPageBlockFields,
  collectSeoFields,
  translationProgressFromFields,
  type TranslationField,
  type TranslationProgress,
} from '@/lib/translation-fields'
import type { PageBlock, NavbarConfig, FooterConfig } from '@/components/page-builder/types'
import { normalizeOrderPromoSlides, type OrderPromoSlide } from '@/components/order-page/promo-slides'
import { isPublishedSeoSnapshot, patchPublishedSeoLocale } from '@/lib/published-seo'
import { defaultFooterConfig, defaultNavbarConfig } from '@/components/page-builder/types'

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export type TranslationBundle = {
  primary: StoreLocaleCode
  locale: StoreLocaleCode
  fields: TranslationField[]
}

type MenuCollectRow = { id: string; name: string; name_i18n?: unknown }
type MenuItemRow = {
  id: string
  name: string
  description: string | null
  name_i18n?: unknown
  description_i18n?: unknown
  category_id: string
}

type TranslationSources = {
  primary: StoreLocaleCode
  pub: Record<string, unknown> | null
  blocks: PageBlock[]
  navbar: NavbarConfig
  footer: FooterConfig
  categories: MenuCollectRow[]
  items: MenuItemRow[]
  variantGroups: { id: string; item_id: string; name: string; name_i18n?: unknown }[]
  variantOptions: { id: string; group_id: string; label: string; label_i18n?: unknown }[]
  slides: OrderPromoSlide[]
}

async function assertLocaleAccess(businessId: string, locale: StoreLocaleCode, primary: StoreLocaleCode) {
  if (locale === primary) {
    return { ok: false as const, error: 'Primary language is edited in the page builder and menu — not here.' }
  }
  const active = await getActiveBusinessLocales(businessId)
  if (!active.includes(locale)) {
    return { ok: false as const, error: 'Activate this language under Settings → Store languages first.' }
  }
  return { ok: true as const }
}

async function loadTranslationSources(businessId: string): Promise<TranslationSources> {
  const primary = await getBusinessPrimaryLocale(businessId)
  const admin = createAdminClient()

  const { data: pub } = await (admin as any)
    .from('publishing_settings')
    .select('seo_title, seo_description, seo_i18n, published_blocks, published_theme, order_promo_slides')
    .eq('business_id', businessId)
    .maybeSingle()

  const { data: theme } = await (admin as any)
    .from('theme_settings')
    .select('navbar_config, footer_config')
    .eq('business_id', businessId)
    .maybeSingle()

  const { data: draftBlocks } = await (admin as any)
    .from('page_blocks')
    .select('*')
    .eq('business_id', businessId)
    .eq('visible', true)
    .order('sort_order', { ascending: true })

  const publishedBlocks = Array.isArray(pub?.published_blocks)
    ? (pub.published_blocks as PageBlock[])
    : []
  const publishedById = new Map(publishedBlocks.map(block => [block.id, block]))

  // Draft blocks are what the page builder is editing. Published snapshots are
  // only a fallback for translations the builder replaced with a plain string.
  const draftList = (draftBlocks ?? []) as PageBlock[]
  const blocks: PageBlock[] = (draftList.length ? draftList : publishedBlocks).map(block => {
    const previous = publishedById.get(block.id)
    return {
      ...block,
      config: syncLocalizedConfig(
        (block.config ?? {}) as unknown as Record<string, unknown>,
        primary,
        [previous?.config as unknown as Record<string, unknown> | undefined],
      ) as unknown as PageBlock['config'],
    }
  })

  const publishedTheme = (pub?.published_theme && typeof pub.published_theme === 'object')
    ? pub.published_theme as { navbar_config?: NavbarConfig; footer_config?: FooterConfig }
    : null
  const navbar = syncLocalizedConfig(
    { ...defaultNavbarConfig, ...((theme?.navbar_config as NavbarConfig | null) ?? publishedTheme?.navbar_config ?? {}) },
    primary,
    [publishedTheme?.navbar_config as Record<string, unknown> | undefined],
  ) as NavbarConfig
  const footer = syncLocalizedConfig(
    { ...defaultFooterConfig, ...((theme?.footer_config as FooterConfig | null) ?? publishedTheme?.footer_config ?? {}) },
    primary,
    [publishedTheme?.footer_config as Record<string, unknown> | undefined],
  ) as FooterConfig

  const [{ data: cats }, { data: items }] = await Promise.all([
    (admin as any).from('menu_categories').select('id, name, name_i18n').eq('business_id', businessId).order('sort_order'),
    (admin as any).from('menu_items').select('id, name, description, name_i18n, description_i18n, category_id').eq('business_id', businessId).order('sort_order'),
  ])

  const itemIds = ((items ?? []) as { id: string }[]).map(i => i.id)
  let variantGroups: { id: string; item_id: string; name: string; name_i18n?: unknown }[] = []
  let variantOptions: { id: string; group_id: string; label: string; label_i18n?: unknown }[] = []

  if (itemIds.length) {
    for (let i = 0; i < itemIds.length; i += 50) {
      const chunk = itemIds.slice(i, i + 50)
      const { data: groups } = await (admin as any)
        .from('menu_item_variant_groups')
        .select('id, item_id, name, name_i18n')
        .in('item_id', chunk)
        .order('sort_order')
      if (groups) variantGroups.push(...groups)
    }
    const groupIds = variantGroups.map(g => g.id)
    for (let i = 0; i < groupIds.length; i += 50) {
      const chunk = groupIds.slice(i, i + 50)
      const { data: opts } = await (admin as any)
        .from('menu_item_variant_options')
        .select('id, group_id, label, label_i18n')
        .in('group_id', chunk)
        .order('sort_order')
      if (opts) variantOptions.push(...opts)
    }
  }

  return {
    primary,
    pub: (pub ?? null) as Record<string, unknown> | null,
    blocks,
    navbar,
    footer,
    categories: (cats ?? []) as MenuCollectRow[],
    items: (items ?? []) as MenuItemRow[],
    variantGroups,
    variantOptions,
    slides: normalizeOrderPromoSlides(pub?.order_promo_slides),
  }
}

function collectFieldsForLocale(sources: TranslationSources, locale: StoreLocaleCode): TranslationField[] {
  const { primary } = sources
  return [
    ...collectSeoFields(sources.pub ?? {}, locale, primary),
    ...collectPageBlockFields(sources.blocks, locale, primary),
    ...collectChromeFields(sources.navbar, sources.footer, locale, primary),
    ...collectMenuFields({
      categories: sources.categories,
      items: sources.items,
      variantGroups: sources.variantGroups,
      variantOptions: sources.variantOptions,
    }, locale, primary),
    ...collectOrderPromoFields(sources.slides, locale, primary),
  ]
}

export async function getTranslationBundleAction(
  businessId: string,
  localeRaw: string,
): Promise<ActionResult<TranslationBundle>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  const access = await assertOwnerOrManager(supabase, user.id, businessId)
  if (!access.ok) return { success: false, error: access.error }

  if (!isStoreLocaleCode(localeRaw)) return { success: false, error: 'Unsupported language' }
  const locale = localeRaw
  const sources = await loadTranslationSources(businessId)
  const gate = await assertLocaleAccess(businessId, locale, sources.primary)
  if (!gate.ok) return { success: false, error: gate.error }

  return {
    success: true,
    data: {
      primary: sources.primary,
      locale,
      fields: collectFieldsForLocale(sources, locale),
    },
  }
}

/** Progress (translated / total fields) for each requested secondary locale. */
export async function getTranslationProgressAction(
  businessId: string,
  localesRaw: string[],
): Promise<ActionResult<Record<string, TranslationProgress>>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  const access = await assertOwnerOrManager(supabase, user.id, businessId)
  if (!access.ok) return { success: false, error: access.error }

  const locales = localesRaw.filter(isStoreLocaleCode)
  if (!locales.length) return { success: true, data: {} }

  const sources = await loadTranslationSources(businessId)
  const out: Record<string, TranslationProgress> = {}
  for (const locale of locales) {
    if (locale === sources.primary) continue
    out[locale] = translationProgressFromFields(collectFieldsForLocale(sources, locale))
  }
  return { success: true, data: out }
}

export async function saveTranslationsAction(
  businessId: string,
  localeRaw: string,
  updates: Record<string, string | null>,
): Promise<ActionResult<{ saved: number }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  const access = await assertOwnerOrManager(supabase, user.id, businessId)
  if (!access.ok) return { success: false, error: access.error }

  if (!isStoreLocaleCode(localeRaw)) return { success: false, error: 'Unsupported language' }
  const locale = localeRaw
  const primary = await getBusinessPrimaryLocale(businessId)
  const gate = await assertLocaleAccess(businessId, locale, primary)
  if (!gate.ok) return { success: false, error: gate.error }

  const entries = Object.entries(updates).filter(([, v]) => v === null || typeof v === 'string')
  if (!entries.length) return { success: true, data: { saved: 0 } }

  const admin = createAdminClient()
  let saved = 0

  // Group updates by target
  const menuCategory: Record<string, string | null> = {}
  const menuItemName: Record<string, string | null> = {}
  const menuItemDesc: Record<string, string | null> = {}
  const variantGroup: Record<string, string | null> = {}
  const variantOption: Record<string, string | null> = {}
  const blockPatches: Record<string, Record<string, string | null>> = {}
  const chromePatches: Record<string, string | null> = {}
  const seoPatches: Record<string, string | null> = {}
  const orderPatches: Record<string, string | null> = {}

  for (const [id, text] of entries) {
    const parts = id.split('.')
    if (parts[0] === 'menu' && parts[1] === 'category' && parts[3] === 'name') {
      menuCategory[parts[2]] = text
    } else if (parts[0] === 'menu' && parts[1] === 'item' && parts[3] === 'name') {
      menuItemName[parts[2]] = text
    } else if (parts[0] === 'menu' && parts[1] === 'item' && parts[3] === 'description') {
      menuItemDesc[parts[2]] = text
    } else if (parts[0] === 'menu' && parts[1] === 'variantGroup' && parts[3] === 'name') {
      variantGroup[parts[2]] = text
    } else if (parts[0] === 'menu' && parts[1] === 'variantOption' && parts[3] === 'label') {
      variantOption[parts[2]] = text
    } else if (parts[0] === 'page' && parts[1] === 'block') {
      const blockId = parts[2]
      const rest = parts.slice(3).join('.')
      if (!blockPatches[blockId]) blockPatches[blockId] = {}
      blockPatches[blockId][rest] = text
    } else if (parts[0] === 'chrome') {
      chromePatches[parts.slice(1).join('.')] = text
    } else if (parts[0] === 'seo') {
      seoPatches[parts[1]] = text
    } else if (parts[0] === 'order' && parts[1] === 'promo') {
      orderPatches[`${parts[2]}.alt`] = text
    }
  }

  // ── Menu categories ──
  for (const [id, text] of Object.entries(menuCategory)) {
    const { data: row } = await (admin as any).from('menu_categories').select('name, name_i18n').eq('id', id).eq('business_id', businessId).maybeSingle()
    if (!row) continue
    const name_i18n = applyLocaleChange(
      (row.name_i18n ?? row.name) as LocalizedString,
      locale,
      text,
      primary,
      row.name ?? '',
    )
    await (admin as any).from('menu_categories').update({
      name_i18n,
      name: primaryPlainText(name_i18n, primary),
    }).eq('id', id)
    saved++
  }

  // ── Menu items ──
  const itemIds = new Set([...Object.keys(menuItemName), ...Object.keys(menuItemDesc)])
  for (const id of itemIds) {
    const { data: row } = await (admin as any)
      .from('menu_items')
      .select('name, description, name_i18n, description_i18n')
      .eq('id', id)
      .eq('business_id', businessId)
      .maybeSingle()
    if (!row) continue
    const patch: Record<string, unknown> = {}
    if (menuItemName[id] !== undefined) {
      const name_i18n = applyLocaleChange(
        (row.name_i18n ?? row.name) as LocalizedString,
        locale,
        menuItemName[id],
        primary,
        row.name ?? '',
      )
      patch.name_i18n = name_i18n
      patch.name = primaryPlainText(name_i18n, primary)
      saved++
    }
    if (menuItemDesc[id] !== undefined) {
      const description_i18n = applyLocaleChange(
        (row.description_i18n ?? row.description) as LocalizedString,
        locale,
        menuItemDesc[id],
        primary,
        row.description ?? '',
      )
      patch.description_i18n = description_i18n
      patch.description = primaryPlainText(description_i18n, primary) || null
      saved++
    }
    if (Object.keys(patch).length) {
      await (admin as any).from('menu_items').update(patch).eq('id', id)
    }
  }

  for (const [id, text] of Object.entries(variantGroup)) {
    const { data: row } = await (admin as any).from('menu_item_variant_groups').select('name, name_i18n').eq('id', id).maybeSingle()
    if (!row) continue
    const name_i18n = applyLocaleChange(
      (row.name_i18n ?? row.name) as LocalizedString,
      locale,
      text,
      primary,
      row.name ?? '',
    )
    await (admin as any).from('menu_item_variant_groups').update({
      name_i18n,
      name: primaryPlainText(name_i18n, primary),
    }).eq('id', id)
    saved++
  }

  for (const [id, text] of Object.entries(variantOption)) {
    const { data: row } = await (admin as any).from('menu_item_variant_options').select('label, label_i18n').eq('id', id).maybeSingle()
    if (!row) continue
    const label_i18n = applyLocaleChange(
      (row.label_i18n ?? row.label) as LocalizedString,
      locale,
      text,
      primary,
      row.label ?? '',
    )
    await (admin as any).from('menu_item_variant_options').update({
      label_i18n,
      label: primaryPlainText(label_i18n, primary),
    }).eq('id', id)
    saved++
  }

  // ── Page blocks (draft + the same text fields on the published snapshot) ──
  if (Object.keys(blockPatches).length) {
    const [{ data: draftBlocks }, { data: pubBlocksRow }] = await Promise.all([
      (admin as any).from('page_blocks').select('*').eq('business_id', businessId),
      (admin as any).from('publishing_settings').select('published_blocks').eq('business_id', businessId).maybeSingle(),
    ])

    const byId = new Map<string, Record<string, unknown>>()
    for (const b of (draftBlocks ?? []) as Record<string, unknown>[]) {
      byId.set(String(b.id), b)
    }
    const publishedList = Array.isArray(pubBlocksRow?.published_blocks)
      ? pubBlocksRow.published_blocks as Record<string, unknown>[]
      : []
    const publishedById = new Map(publishedList.map(b => [String(b.id), b]))
    const healedById = new Map<string, Record<string, unknown>>()

    for (const [blockId, fields] of Object.entries(blockPatches)) {
      const row = byId.get(blockId)
      if (!row) continue
      const publishedConfig = (publishedById.get(blockId)?.config ?? null) as Record<string, unknown> | null
      const config = syncLocalizedConfig(
        { ...((row.config as Record<string, unknown>) ?? {}) },
        primary,
        [publishedConfig],
      )
      for (const [path, text] of Object.entries(fields)) {
        if (path === 'cta.label' || path === 'cta_secondary.label') {
          const key = path.startsWith('cta_secondary') ? 'cta_secondary' : 'cta'
          const cta = { ...((config[key] as Record<string, unknown>) ?? {}) }
          cta.label = applyLocaleChange(cta.label as LocalizedString, locale, text, primary)
          config[key] = cta
        } else {
          config[path] = applyLocaleChange(config[path] as LocalizedString, locale, text, primary)
        }
        saved++
      }
      healedById.set(blockId, config)
      await (admin as any).from('page_blocks').update({ config }).eq('id', blockId)
    }

    if (publishedList.length && healedById.size) {
      const nextBlocks = publishedList.map(b => {
        const healed = healedById.get(String(b.id))
        if (!healed) return b
        const patches = blockPatches[String(b.id)]
        if (!patches) return b
        const config = { ...((b.config as Record<string, unknown>) ?? {}) }
        for (const path of Object.keys(patches)) {
          if (path === 'cta.label' || path === 'cta_secondary.label') {
            const key = path.startsWith('cta_secondary') ? 'cta_secondary' : 'cta'
            const healedCta = healed[key]
            if (healedCta && typeof healedCta === 'object') {
              const cta = { ...((config[key] as Record<string, unknown>) ?? {}) }
              cta.label = (healedCta as Record<string, unknown>).label
              config[key] = cta
            }
          } else if (path in healed) {
            config[path] = healed[path]
          }
        }
        return { ...b, config }
      })
      await (admin as any)
        .from('publishing_settings')
        .update({ published_blocks: nextBlocks })
        .eq('business_id', businessId)
    }
  }

  // ── Chrome (navbar / footer) on theme_settings + published_theme ──
  if (Object.keys(chromePatches).length) {
    const [{ data: theme }, { data: pubThemeRow }] = await Promise.all([
      (admin as any)
        .from('theme_settings')
        .select('navbar_config, footer_config')
        .eq('business_id', businessId)
        .maybeSingle(),
      (admin as any)
        .from('publishing_settings')
        .select('published_theme')
        .eq('business_id', businessId)
        .maybeSingle(),
    ])

    const publishedTheme = (pubThemeRow?.published_theme && typeof pubThemeRow.published_theme === 'object')
      ? pubThemeRow.published_theme as { navbar_config?: NavbarConfig; footer_config?: FooterConfig }
      : null

    let navbar = syncLocalizedConfig(
      { ...defaultNavbarConfig, ...((theme?.navbar_config as NavbarConfig | null) ?? {}) },
      primary,
      [publishedTheme?.navbar_config as Record<string, unknown> | undefined],
    ) as NavbarConfig
    let footer = syncLocalizedConfig(
      { ...defaultFooterConfig, ...((theme?.footer_config as FooterConfig | null) ?? {}) },
      primary,
      [publishedTheme?.footer_config as Record<string, unknown> | undefined],
    ) as FooterConfig

    for (const [path, text] of Object.entries(chromePatches)) {
      if (path.startsWith('navbar.link.')) {
        const idx = Number(path.split('.')[2])
        const links = [...(navbar.links ?? [])]
        if (links[idx]) {
          links[idx] = {
            ...links[idx],
            label: applyLocaleChange(links[idx].label as LocalizedString, locale, text, primary) as unknown as string,
          }
          navbar = { ...navbar, links }
          saved++
        }
      } else if (path === 'footer.copyright_text') {
        footer = {
          ...footer,
          copyright_text: applyLocaleChange(footer.copyright_text as LocalizedString, locale, text, primary) as unknown as string,
        }
        saved++
      }
    }

    await (admin as any)
      .from('theme_settings')
      .upsert({ business_id: businessId, navbar_config: navbar, footer_config: footer }, { onConflict: 'business_id' })

    const { data: pub } = await (admin as any)
      .from('publishing_settings')
      .select('published_theme')
      .eq('business_id', businessId)
      .maybeSingle()

    if (pub?.published_theme && typeof pub.published_theme === 'object') {
      const published_theme = {
        ...(pub.published_theme as Record<string, unknown>),
        navbar_config: navbar,
        footer_config: footer,
      }
      await (admin as any)
        .from('publishing_settings')
        .update({ published_theme })
        .eq('business_id', businessId)
    }
  }

  // ── SEO ──
  if (Object.keys(seoPatches).length) {
    const { data: pub } = await (admin as any)
      .from('publishing_settings')
      .select('seo_title, seo_description, seo_i18n, published_seo')
      .eq('business_id', businessId)
      .maybeSingle()

    const existing = (pub?.seo_i18n && typeof pub.seo_i18n === 'object')
      ? pub.seo_i18n as Record<string, unknown>
      : {}

    const titleSource = setPrimaryLocaleText(
      (existing.title as LocalizedString) ?? pub?.seo_title ?? '',
      pub?.seo_title ?? '',
      primary,
    )
    const descSource = setPrimaryLocaleText(
      (existing.description as LocalizedString) ?? pub?.seo_description ?? '',
      pub?.seo_description ?? '',
      primary,
    )

    const next: Record<string, unknown> = { ...existing }
    if (seoPatches.title !== undefined) {
      next.title = applyLocaleChange(titleSource, locale, seoPatches.title, primary)
      saved++
    }
    if (seoPatches.description !== undefined) {
      next.description = applyLocaleChange(descSource, locale, seoPatches.description, primary)
      saved++
    }

    await (admin as any)
      .from('publishing_settings')
      .update({
        seo_i18n: next,
        seo_title: primaryPlainText((next.title as LocalizedString) ?? titleSource, primary) || pub?.seo_title,
        seo_description: primaryPlainText((next.description as LocalizedString) ?? descSource, primary) || pub?.seo_description,
      })
      .eq('business_id', businessId)

    if (isPublishedSeoSnapshot(pub?.published_seo)) {
      const published_seo = patchPublishedSeoLocale(pub.published_seo, locale, primary, {
        ...(seoPatches.title !== undefined ? { title: seoPatches.title } : {}),
        ...(seoPatches.description !== undefined ? { description: seoPatches.description } : {}),
      })
      await (admin as any)
        .from('publishing_settings')
        .update({ published_seo })
        .eq('business_id', businessId)
    }
  }

  // ── Order promo alts ──
  if (Object.keys(orderPatches).length) {
    const { data: pub } = await (admin as any)
      .from('publishing_settings')
      .select('order_promo_slides')
      .eq('business_id', businessId)
      .maybeSingle()

    const slides = normalizeOrderPromoSlides(pub?.order_promo_slides).map(slide => {
      const key = `${slide.id}.alt`
      if (orderPatches[key] === undefined) return slide
      const prev = setPrimaryLocaleText(
        (slide as { alt_i18n?: LocalizedString }).alt_i18n ?? slide.alt,
        slide.alt ?? '',
        primary,
      )
      const alt_i18n = applyLocaleChange(prev, locale, orderPatches[key], primary)
      saved++
      return {
        ...slide,
        alt: primaryPlainText(alt_i18n, primary),
        alt_i18n,
      }
    })

    await (admin as any)
      .from('publishing_settings')
      .update({ order_promo_slides: slides, order_has_unpublished_changes: true })
      .eq('business_id', businessId)
  }

  revalidatePath('/dashboard/translations')
  revalidatePath(`/dashboard/translations/${locale}`)

  const { data: biz } = await (admin as any)
    .from('businesses')
    .select('slug')
    .eq('id', businessId)
    .maybeSingle()
  if (biz?.slug) {
    revalidatePath(`/${biz.slug}`)
    revalidatePath(`/${biz.slug}/order`)
    revalidatePath(`/${locale}/${biz.slug}`)
    revalidatePath(`/${locale}/${biz.slug}/order`)
  }

  return { success: true, data: { saved } }
}
