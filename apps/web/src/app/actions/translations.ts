'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { assertOwnerOrManager } from '@/lib/business-auth'
import { getActiveBusinessLocales, getBusinessPrimaryLocale } from '@/app/actions/business-locales'
import { isStoreLocaleCode, type StoreLocaleCode } from '@/i18n/store-locales'
import { writeLocaleText, primaryPlainText, type LocalizedString } from '@/i18n/localized-content'
import {
  collectChromeFields,
  collectMenuFields,
  collectOrderPromoFields,
  collectPageBlockFields,
  collectSeoFields,
  type TranslationField,
} from '@/lib/translation-fields'
import type { PageBlock, NavbarConfig, FooterConfig } from '@/components/page-builder/types'
import { normalizeOrderPromoSlides } from '@/components/order-page/promo-slides'
import { defaultFooterConfig, defaultNavbarConfig } from '@/components/page-builder/types'

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export type TranslationBundle = {
  primary: StoreLocaleCode
  locale: StoreLocaleCode
  fields: TranslationField[]
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
  const primary = await getBusinessPrimaryLocale(businessId)
  const gate = await assertLocaleAccess(businessId, locale, primary)
  if (!gate.ok) return { success: false, error: gate.error }

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

  let blocks: PageBlock[] = []
  if (Array.isArray(pub?.published_blocks) && pub.published_blocks.length) {
    blocks = (pub.published_blocks as PageBlock[]).filter(b => b.visible !== false)
  } else {
    const { data: draftBlocks } = await (admin as any)
      .from('page_blocks')
      .select('*')
      .eq('business_id', businessId)
      .eq('visible', true)
      .order('sort_order', { ascending: true })
    blocks = (draftBlocks ?? []) as PageBlock[]
  }

  const themeSource = pub?.published_theme ?? theme
  const navbar = (themeSource?.navbar_config as NavbarConfig | null) ?? defaultNavbarConfig
  const footer = (themeSource?.footer_config as FooterConfig | null) ?? defaultFooterConfig

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

  const slides = normalizeOrderPromoSlides(pub?.order_promo_slides)

  const fields: TranslationField[] = [
    ...collectSeoFields(pub ?? {}, locale, primary),
    ...collectPageBlockFields(blocks, locale, primary),
    ...collectChromeFields(navbar, footer, locale, primary),
    ...collectMenuFields({
      categories: (cats ?? []) as MenuCollectRow[],
      items: (items ?? []) as MenuItemRow[],
      variantGroups,
      variantOptions,
    }, locale, primary),
    ...collectOrderPromoFields(slides, locale, primary),
  ]

  return { success: true, data: { primary, locale, fields } }
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

export async function saveTranslationsAction(
  businessId: string,
  localeRaw: string,
  updates: Record<string, string>,
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

  const entries = Object.entries(updates).filter(([, v]) => typeof v === 'string')
  if (!entries.length) return { success: true, data: { saved: 0 } }

  const admin = createAdminClient()
  let saved = 0

  // Group updates by target
  const menuCategory: Record<string, string> = {}
  const menuItemName: Record<string, string> = {}
  const menuItemDesc: Record<string, string> = {}
  const variantGroup: Record<string, string> = {}
  const variantOption: Record<string, string> = {}
  const blockPatches: Record<string, Record<string, string>> = {}
  const chromePatches: Record<string, string> = {}
  const seoPatches: Record<string, string> = {}
  const orderPatches: Record<string, string> = {}

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
    const name_i18n = writeLocaleText((row.name_i18n ?? row.name) as LocalizedString, locale, text, primary)
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
      const name_i18n = writeLocaleText((row.name_i18n ?? row.name) as LocalizedString, locale, menuItemName[id], primary)
      patch.name_i18n = name_i18n
      patch.name = primaryPlainText(name_i18n, primary)
      saved++
    }
    if (menuItemDesc[id] !== undefined) {
      const description_i18n = writeLocaleText(
        (row.description_i18n ?? row.description) as LocalizedString,
        locale,
        menuItemDesc[id],
        primary,
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
    const name_i18n = writeLocaleText((row.name_i18n ?? row.name) as LocalizedString, locale, text, primary)
    await (admin as any).from('menu_item_variant_groups').update({
      name_i18n,
      name: primaryPlainText(name_i18n, primary),
    }).eq('id', id)
    saved++
  }

  for (const [id, text] of Object.entries(variantOption)) {
    const { data: row } = await (admin as any).from('menu_item_variant_options').select('label, label_i18n').eq('id', id).maybeSingle()
    if (!row) continue
    const label_i18n = writeLocaleText((row.label_i18n ?? row.label) as LocalizedString, locale, text, primary)
    await (admin as any).from('menu_item_variant_options').update({
      label_i18n,
      label: primaryPlainText(label_i18n, primary),
    }).eq('id', id)
    saved++
  }

  // ── Page blocks (draft + published snapshot) ──
  if (Object.keys(blockPatches).length) {
    const { data: draftBlocks } = await (admin as any)
      .from('page_blocks')
      .select('*')
      .eq('business_id', businessId)

    const byId = new Map<string, Record<string, unknown>>()
    for (const b of (draftBlocks ?? []) as Record<string, unknown>[]) {
      byId.set(String(b.id), b)
    }

    for (const [blockId, fields] of Object.entries(blockPatches)) {
      const row = byId.get(blockId)
      if (!row) continue
      const config = { ...((row.config as Record<string, unknown>) ?? {}) }
      for (const [path, text] of Object.entries(fields)) {
        if (path === 'cta.label' || path === 'cta_secondary.label') {
          const key = path.startsWith('cta_secondary') ? 'cta_secondary' : 'cta'
          const cta = { ...((config[key] as Record<string, unknown>) ?? {}) }
          cta.label = writeLocaleText(cta.label as LocalizedString, locale, text, primary)
          config[key] = cta
        } else {
          config[path] = writeLocaleText(config[path] as LocalizedString, locale, text, primary)
        }
        saved++
      }
      await (admin as any).from('page_blocks').update({ config }).eq('id', blockId)
    }

    // Refresh published_blocks snapshot if present
    const { data: pub } = await (admin as any)
      .from('publishing_settings')
      .select('published_blocks')
      .eq('business_id', businessId)
      .maybeSingle()

    if (Array.isArray(pub?.published_blocks)) {
      const nextBlocks = (pub.published_blocks as Record<string, unknown>[]).map(b => {
        const id = String(b.id)
        const patches = blockPatches[id]
        if (!patches) return b
        const config = { ...((b.config as Record<string, unknown>) ?? {}) }
        for (const [path, text] of Object.entries(patches)) {
          if (path === 'cta.label' || path === 'cta_secondary.label') {
            const key = path.startsWith('cta_secondary') ? 'cta_secondary' : 'cta'
            const cta = { ...((config[key] as Record<string, unknown>) ?? {}) }
            cta.label = writeLocaleText(cta.label as LocalizedString, locale, text, primary)
            config[key] = cta
          } else {
            config[path] = writeLocaleText(config[path] as LocalizedString, locale, text, primary)
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
    const { data: theme } = await (admin as any)
      .from('theme_settings')
      .select('navbar_config, footer_config')
      .eq('business_id', businessId)
      .maybeSingle()

    let navbar = { ...((theme?.navbar_config as NavbarConfig) ?? defaultNavbarConfig) }
    let footer = { ...((theme?.footer_config as FooterConfig) ?? defaultFooterConfig) }

    for (const [path, text] of Object.entries(chromePatches)) {
      if (path.startsWith('navbar.link.')) {
        const idx = Number(path.split('.')[2])
        const links = [...(navbar.links ?? [])]
        if (links[idx]) {
          links[idx] = {
            ...links[idx],
            label: writeLocaleText(links[idx].label as LocalizedString, locale, text, primary) as unknown as string,
          }
          navbar = { ...navbar, links }
          saved++
        }
      } else if (path === 'footer.copyright_text') {
        footer = {
          ...footer,
          copyright_text: writeLocaleText(footer.copyright_text as LocalizedString, locale, text, primary) as unknown as string,
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
      .select('seo_title, seo_description, seo_i18n')
      .eq('business_id', businessId)
      .maybeSingle()

    const existing = (pub?.seo_i18n && typeof pub.seo_i18n === 'object')
      ? pub.seo_i18n as Record<string, unknown>
      : {}

    const titleSource = (existing.title as LocalizedString) ?? pub?.seo_title ?? ''
    const descSource = (existing.description as LocalizedString) ?? pub?.seo_description ?? ''

    const next: Record<string, unknown> = { ...existing }
    if (seoPatches.title !== undefined) {
      next.title = writeLocaleText(titleSource, locale, seoPatches.title, primary)
      saved++
    }
    if (seoPatches.description !== undefined) {
      next.description = writeLocaleText(descSource, locale, seoPatches.description, primary)
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
      const prev = (slide as { alt_i18n?: LocalizedString }).alt_i18n ?? slide.alt
      const alt_i18n = writeLocaleText(prev, locale, orderPatches[key], primary)
      saved++
      return {
        ...slide,
        alt: primaryPlainText(alt_i18n, primary),
        alt_i18n,
      }
    })

    await (admin as any)
      .from('publishing_settings')
      .update({ order_promo_slides: slides })
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
