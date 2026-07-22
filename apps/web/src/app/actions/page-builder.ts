'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { PageBlock, PublishingSettings, ThemeSettings, NavbarConfig, FooterConfig } from '@/components/page-builder/types'
import {
  normalizeOrderPromoSlides,
  normalizeCarouselAspect,
  normalizeCarouselAspectMobile,
  MAX_ORDER_PROMO_SLIDES,
  type CarouselAspect,
  type CarouselAspectMobile,
  type OrderPromoSlide,
} from '@/components/order-page/promo-slides'
import { normalizeOrderMenuConfig } from '@/components/order-page/order-menu-config'
import { billCustomDomainIfDueAction } from '@/app/actions/credits'
import {
  addDomainToProject,
  verifyProjectDomain,
  getProjectDomain,
  getDomainConfig,
  removeDomainFromProject,
  buildDnsRecords,
  isVercelDomainsConfigured,
  type DnsRecord,
} from '@/lib/vercel-domains'
export type { PublishingSettings } from '@/components/page-builder/types'

function normalizePublishing(row: Record<string, unknown> | null): PublishingSettings | null {
  if (!row) return null
  const published = Boolean(row.published)
  return {
    ...(row as unknown as PublishingSettings),
    published,
    // Fall back to landing publish if column not yet migrated
    order_published: row.order_published == null ? published : Boolean(row.order_published),
    order_promo_slides: normalizeOrderPromoSlides(row.order_promo_slides),
    order_menu_config: normalizeOrderMenuConfig(row.order_menu_config) ?? undefined,
    order_background_color: typeof row.order_background_color === 'string'
      ? row.order_background_color
      : null,
    order_background_image_url: typeof row.order_background_image_url === 'string'
      ? row.order_background_image_url
      : null,
    order_carousel_aspect_desktop: normalizeCarouselAspect(
      row.order_carousel_aspect_desktop,
      '16/9',
    ),
    order_carousel_aspect_mobile: normalizeCarouselAspectMobile(
      row.order_carousel_aspect_mobile ?? 'same',
    ),
  }
}

export type PublishPage = 'landing' | 'order'

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

/** Revalidate the public store page for a business (by slug). */
async function revalidateLiveStore(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  businessId: string
) {
  const { data } = await db
    .from('businesses')
    .select('slug')
    .eq('id', businessId)
    .maybeSingle()
  if (data?.slug) {
    revalidatePath(`/${data.slug}`)
    revalidatePath(`/${data.slug}/order`)
  }
}

// ─── Load page data ───────────────────────────────────────────────────────────

export async function getPageDataAction(businessId: string): Promise<{
  blocks: PageBlock[]
  publishing: PublishingSettings | null
  theme: ThemeSettings | null
}> {
  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase

    const [blocksRes, pubRes, themeRes] = await Promise.all([
      db.from('page_blocks')
        .select('*')
        .eq('business_id', businessId)
        .order('sort_order', { ascending: true }),
      db.from('publishing_settings')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle(),
      db.from('theme_settings')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle(),
    ])

    if (blocksRes.error) console.error('[getPageDataAction] blocks:', blocksRes.error.message)
    if (pubRes.error) console.error('[getPageDataAction] publishing:', pubRes.error.message)
    if (themeRes.error) console.error('[getPageDataAction] theme:', themeRes.error.message)

    return {
      blocks: (blocksRes.data as PageBlock[]) ?? [],
      publishing: normalizePublishing(pubRes.data as Record<string, unknown> | null),
      theme: (themeRes.data as ThemeSettings | null) ?? null,
    }
  } catch (err) {
    console.error('[getPageDataAction] unexpected:', err)
    return { blocks: [], publishing: null, theme: null }
  }
}

// ─── Save all blocks (full replace) ──────────────────────────────────────────
// Most reliable approach: delete business's blocks, insert fresh ordered set.
//
export async function savePageBlocksAction(
  businessId: string,
  blocks: Omit<PageBlock, 'created_at' | 'updated_at'>[]
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase

  // Delete existing + insert fresh in a single round-trip using RPC would be ideal,
  // but since Supabase JS doesn't expose transactions, we do two sequential calls.
  const { error: delErr } = await db
    .from('page_blocks')
    .delete()
    .eq('business_id', businessId)

  if (delErr) return { success: false, error: delErr.message }

  if (blocks.length === 0) {
    revalidatePath('/dashboard/pages')
    return { success: true, data: undefined }
  }

  const rows = blocks.map((b, i) => {
    const isTemp = b.id.startsWith('temp-')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: any = {
      business_id: businessId,
      type: b.type,
      sort_order: i,
      visible: b.visible,
      config: b.config,
      spacing: b.spacing ?? {
        padding_top: 0, padding_right: 0, padding_bottom: 0, padding_left: 0,
        margin_top: 0, margin_bottom: 0,
      },
      custom_css: b.custom_css ?? '',
      block_anchor_id: b.block_anchor_id ?? null,
    }
    if (!isTemp) {
      row.id = b.id
    } else {
      row.id = crypto.randomUUID()
    }
    return row
  })

  const { error: insErr } = await db.from('page_blocks').insert(rows)
  if (insErr) return { success: false, error: insErr.message }

  // Set has_unpublished_changes to true
  await db.from('publishing_settings')
    .upsert({ business_id: businessId, has_unpublished_changes: true }, { onConflict: 'business_id' })

  revalidatePath('/dashboard/pages')
  await revalidateLiveStore(supabase, businessId)
  return { success: true, data: undefined }
}

// ─── Publishing ───────────────────────────────────────────────────────────────

export async function togglePublishAction(
  businessId: string,
  published: boolean,
  page: PublishPage = 'landing'
): Promise<ActionResult<PublishingSettings>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  if (page === 'order') {
    const { data, error } = await supabase
      .from('publishing_settings')
      .upsert(
        { business_id: businessId, order_published: published },
        { onConflict: 'business_id' }
      )
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/publishing')
    await revalidateLiveStore(supabase, businessId)
    return { success: true, data: normalizePublishing(data as Record<string, unknown>)! }
  }

  // Landing publish — snapshot draft blocks/theme into the live snapshot
  let published_blocks = undefined
  let published_theme = undefined

  if (published) {
    const [blocksRes, themeRes] = await Promise.all([
      supabase.from('page_blocks').select('*').eq('business_id', businessId).order('sort_order', { ascending: true }),
      supabase.from('theme_settings').select('*').eq('business_id', businessId).single()
    ])
    if (blocksRes.data) published_blocks = blocksRes.data
    if (themeRes.data) published_theme = themeRes.data
  }

  const { data, error } = await supabase
    .from('publishing_settings')
    .upsert(
      {
        business_id: businessId,
        published,
        ...(published ? { has_unpublished_changes: false, published_blocks, published_theme } : {})
      },
      { onConflict: 'business_id' }
    )
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/pages')
  revalidatePath('/dashboard/publishing')
  await revalidateLiveStore(supabase, businessId)
  return { success: true, data: normalizePublishing(data as Record<string, unknown>)! }
}

export async function saveOrderPromoSlidesAction(
  businessId: string,
  slides: OrderPromoSlide[],
): Promise<ActionResult<OrderPromoSlide[]>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const cleaned = normalizeOrderPromoSlides(slides).slice(0, MAX_ORDER_PROMO_SLIDES)

  const { data, error } = await supabase
    .from('publishing_settings')
    .upsert(
      { business_id: businessId, order_promo_slides: cleaned as unknown as never },
      { onConflict: 'business_id' },
    )
    .select('order_promo_slides')
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/publishing')
  revalidatePath('/dashboard/order-page')
  await revalidateLiveStore(supabase, businessId)
  return {
    success: true,
    data: normalizeOrderPromoSlides(data?.order_promo_slides),
  }
}

export async function saveOrderMenuConfigAction(
  businessId: string,
  config: import('@/components/page-builder/types').MenuGridConfig,
): Promise<ActionResult<import('@/components/page-builder/types').MenuGridConfig>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const cleaned = normalizeOrderMenuConfig(config)
  if (!cleaned) return { success: false, error: 'Invalid menu config' }

  // Order page never filters by category/item — always show full menu
  const orderCleaned = {
    ...cleaned,
    selection_mode: 'category' as const,
    category_ids: [] as string[],
    item_ids: [] as string[],
  }

  const { data, error } = await supabase
    .from('publishing_settings')
    .upsert(
      { business_id: businessId, order_menu_config: orderCleaned as unknown as never },
      { onConflict: 'business_id' },
    )
    .select('order_menu_config')
    .single()

  if (error) return { success: false, error: error.message }
  const saved = normalizeOrderMenuConfig(data?.order_menu_config)
  if (!saved) return { success: false, error: 'Failed to save menu config' }
  const orderSaved = {
    ...saved,
    selection_mode: 'category' as const,
    category_ids: [] as string[],
    item_ids: [] as string[],
  }
  revalidatePath('/dashboard/publishing')
  revalidatePath('/dashboard/order-page')
  await revalidateLiveStore(supabase, businessId)
  return { success: true, data: orderSaved }
}

export async function clearOrderMenuConfigAction(
  businessId: string,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('publishing_settings')
    .upsert(
      { business_id: businessId, order_menu_config: null },
      { onConflict: 'business_id' },
    )

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/publishing')
  revalidatePath('/dashboard/order-page')
  await revalidateLiveStore(supabase, businessId)
  return { success: true, data: undefined }
}

export async function saveOrderAppearanceAction(
  businessId: string,
  fields: {
    order_background_color?: string | null
    order_background_image_url?: string | null
  },
): Promise<ActionResult<PublishingSettings>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('publishing_settings')
    .upsert(
      {
        business_id: businessId,
        order_background_color: fields.order_background_color ?? null,
        order_background_image_url: fields.order_background_image_url ?? null,
      },
      { onConflict: 'business_id' },
    )
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/order-page')
  await revalidateLiveStore(supabase, businessId)
  return { success: true, data: normalizePublishing(data as Record<string, unknown>)! }
}

export async function saveOrderCarouselAspectAction(
  businessId: string,
  fields: {
    desktop: CarouselAspect
    mobile: CarouselAspectMobile
  },
): Promise<ActionResult<{ desktop: CarouselAspect; mobile: CarouselAspectMobile }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const desktop = normalizeCarouselAspect(fields.desktop, '16/9')
  const mobile = normalizeCarouselAspectMobile(fields.mobile)

  const { error } = await supabase
    .from('publishing_settings')
    .upsert(
      {
        business_id: businessId,
        order_carousel_aspect_desktop: desktop as unknown as never,
        order_carousel_aspect_mobile: mobile as unknown as never,
      },
      { onConflict: 'business_id' },
    )

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/order-page')
  revalidatePath('/dashboard/publishing')
  await revalidateLiveStore(supabase, businessId)
  return { success: true, data: { desktop, mobile } }
}

/** Unified autosave for the Order Page builder (appearance + carousel + menu). */
export async function saveOrderPageDraftAction(
  businessId: string,
  draft: {
    order_background_color?: string | null
    order_background_image_url?: string | null
    order_promo_slides: OrderPromoSlide[]
    order_carousel_aspect_desktop: CarouselAspect
    order_carousel_aspect_mobile: CarouselAspectMobile
    /** null clears custom config and falls back to defaults */
    order_menu_config: import('@/components/page-builder/types').MenuGridConfig | null
  },
): Promise<ActionResult<PublishingSettings>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const slides = normalizeOrderPromoSlides(draft.order_promo_slides).slice(0, MAX_ORDER_PROMO_SLIDES)
  const desktop = normalizeCarouselAspect(draft.order_carousel_aspect_desktop, '16/9')
  const mobile = normalizeCarouselAspectMobile(draft.order_carousel_aspect_mobile)

  let menuPayload: unknown = null
  if (draft.order_menu_config != null) {
    const cleaned = normalizeOrderMenuConfig(draft.order_menu_config)
    if (!cleaned) return { success: false, error: 'Invalid menu config' }
    menuPayload = {
      ...cleaned,
      selection_mode: 'category' as const,
      category_ids: [] as string[],
      item_ids: [] as string[],
    }
  }

  const { data, error } = await supabase
    .from('publishing_settings')
    .upsert(
      {
        business_id: businessId,
        order_background_color: draft.order_background_color ?? null,
        order_background_image_url: draft.order_background_image_url ?? null,
        order_promo_slides: slides as unknown as never,
        order_carousel_aspect_desktop: desktop as unknown as never,
        order_carousel_aspect_mobile: mobile as unknown as never,
        order_menu_config: menuPayload as never,
      },
      { onConflict: 'business_id' },
    )
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/order-page')
  revalidatePath('/dashboard/publishing')
  await revalidateLiveStore(supabase, businessId)
  return { success: true, data: normalizePublishing(data as Record<string, unknown>)! }
}

// ─── Theme ─────────────────────────────────────────────────────────────────────

export async function saveThemeAction(
  businessId: string,
  theme: { primary_color: string; background_color: string; text_color: string; font_family: string; heading_font_family: string }
): Promise<ActionResult<ThemeSettings>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase
    .from('theme_settings')
    .upsert(
      { business_id: businessId, ...theme },
      { onConflict: 'business_id' }
    )
    .select()
    .single()

  await supabase.from('publishing_settings')
    .upsert({ business_id: businessId, has_unpublished_changes: true }, { onConflict: 'business_id' })

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/pages')
  await revalidateLiveStore(supabase, businessId)
  return { success: true, data }
}

// ─── Save navbar config (stored in theme_settings) ─────────────────────────────────

export async function saveNavbarAction(
  businessId: string,
  navbarConfig: NavbarConfig
): Promise<ActionResult<ThemeSettings>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase
    .from('theme_settings')
    .upsert(
      { business_id: businessId, navbar_config: navbarConfig },
      { onConflict: 'business_id' }
    )
    .select()
    .single()

  await supabase.from('publishing_settings')
    .upsert({ business_id: businessId, has_unpublished_changes: true }, { onConflict: 'business_id' })

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/pages')
  await revalidateLiveStore(supabase, businessId)
  return { success: true, data }
}

export async function saveFooterAction(
  businessId: string,
  footerConfig: FooterConfig
): Promise<ActionResult<ThemeSettings>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('theme_settings')
    .upsert(
      { business_id: businessId, footer_config: footerConfig },
      { onConflict: 'business_id' }
    )
    .select()
    .single()

  await supabase.from('publishing_settings')
    .upsert({ business_id: businessId, has_unpublished_changes: true }, { onConflict: 'business_id' })

  if (error) {
    const message = error.message.includes('footer_config')
      ? 'Footer settings could not be saved. Run database migration 034_footer_config.sql on your Supabase project, then retry.'
      : error.message
    return { success: false, error: message }
  }
  revalidatePath('/dashboard/pages')
  await revalidateLiveStore(supabase, businessId)
  return { success: true, data }
}

// ─── Publishing settings (standalone, for /dashboard/publishing) ──────────────

export async function getPublishingAction(businessId: string): Promise<{
  publishing: PublishingSettings | null
  slug: string | null
}> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase

  const [pubRes, bizRes] = await Promise.all([
    db.from('publishing_settings').select('*').eq('business_id', businessId).single(),
    db.from('businesses').select('slug').eq('id', businessId).single(),
  ])

  return {
    publishing: normalizePublishing(pubRes.data as Record<string, unknown> | null),
    slug: bizRes.data?.slug ?? null,
  }
}

export async function savePublishingSettingsAction(
  businessId: string,
  fields: {
    custom_domain?: string | null
    custom_domain_verified?: boolean
    custom_domain_billed_until?: string | null
    seo_title?: string | null
    seo_description?: string | null
    og_image_url?: string | null
    favicon_url?: string | null
    apple_touch_icon_url?: string | null
    language?: string
    gsc_verification?: string | null
    google_analytics_id?: string | null
    facebook_pixel_id?: string | null
    tiktok_pixel_id?: string | null
  }
): Promise<ActionResult<PublishingSettings>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    if ('custom_domain' in fields) {
      fields.custom_domain_verified = false
      fields.custom_domain_billed_until = null
    }

    const payload: Record<string, unknown> = { business_id: businessId, ...fields }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('publishing_settings')
      .upsert(payload, { onConflict: 'business_id' })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/publishing')
    await revalidateLiveStore(supabase, businessId)
    return { success: true, data: normalizePublishing(data as Record<string, unknown>)! }
  } catch (err) {
    console.error('[savePublishingSettingsAction]', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to save publishing settings',
    }
  }
}

// ─── Page view analytics ──────────────────────────────────────────────────────

export interface DayViewStat { date: string; count: number }

export async function getPageViewsAction(
  businessId: string,
  period: 7 | 30 = 7
): Promise<{
  total: number
  periodTotal: number
  daily: DayViewStat[]  // last `period` days, oldest → newest, gaps filled with 0
}> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase

  const since = new Date()
  since.setDate(since.getDate() - (period - 1))
  const sinceStr = since.toISOString().slice(0, 10)

  const { data: rows } = await db
    .from('page_views')
    .select('viewed_at, count')
    .eq('business_id', businessId)
    .gte('viewed_at', sinceStr)
    .order('viewed_at', { ascending: true })

  const { data: allRows } = await db
    .from('page_views')
    .select('count')
    .eq('business_id', businessId)

  const total = (allRows ?? []).reduce((s: number, r: { count: number }) => s + r.count, 0)

  const dailyMap: Record<string, number> = {}
  for (const row of (rows ?? [])) {
    dailyMap[row.viewed_at] = row.count
  }

  const daily: DayViewStat[] = []
  for (let i = period - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    daily.push({ date: key, count: dailyMap[key] ?? 0 })
  }

  const periodTotal = daily.reduce((s, d) => s + d.count, 0)

  return { total, periodTotal, daily }
}

// ─── Custom domain (self-service via Vercel API) ─────────────────────────────

export async function getCustomDomainSetupAction(businessId: string): Promise<{
  domain: string | null
  verified: boolean
  dnsRecords: DnsRecord[]
}> {
  const supabase = await createClient()
  const { data: pub } = await (supabase as any)
    .from('publishing_settings')
    .select('custom_domain, custom_domain_verified')
    .eq('business_id', businessId)
    .single()

  const domain = pub?.custom_domain ?? null
  const verified = pub?.custom_domain_verified === true

  if (!domain) {
    return { domain: null, verified: false, dnsRecords: [] }
  }

  if (verified) {
    return { domain, verified: true, dnsRecords: [] }
  }

  const vercel = await getProjectDomain(domain)
  const dnsRecords = buildDnsRecords(domain, vercel.verification)

  return { domain, verified: false, dnsRecords }
}

export async function connectCustomDomainAction(
  businessId: string,
  domain: string
): Promise<ActionResult<{ dnsRecords: DnsRecord[] }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const normalized = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  if (!normalized || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(normalized)) {
    return { success: false, error: 'Tên miền không hợp lệ' }
  }

  if (!isVercelDomainsConfigured()) {
    return { success: false, error: 'Custom domains chưa được cấu hình trên máy chủ. Liên hệ hỗ trợ.' }
  }

  const { data: existing } = await (supabase as any)
    .from('publishing_settings')
    .select('custom_domain')
    .eq('business_id', businessId)
    .single()

  if (existing?.custom_domain && existing.custom_domain !== normalized) {
    await removeDomainFromProject(existing.custom_domain)
  }

  const vercel = await addDomainToProject(normalized)
  if (!vercel.ok) {
    return { success: false, error: vercel.error || 'Không thể đăng ký tên miền với Vercel' }
  }

  const dnsRecords = buildDnsRecords(normalized, vercel.verification)

  const { error } = await (supabase as any)
    .from('publishing_settings')
    .upsert(
      {
        business_id: businessId,
        custom_domain: normalized,
        custom_domain_verified: false,
        custom_domain_billed_until: null,
      },
      { onConflict: 'business_id' }
    )

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/publishing')
  return { success: true, data: { dnsRecords } }
}

export async function disconnectCustomDomainAction(businessId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: existing } = await (supabase as any)
    .from('publishing_settings')
    .select('custom_domain')
    .eq('business_id', businessId)
    .single()

  if (existing?.custom_domain) {
    await removeDomainFromProject(existing.custom_domain)
  }

  const { error } = await (supabase as any)
    .from('publishing_settings')
    .upsert(
      {
        business_id: businessId,
        custom_domain: null,
        custom_domain_verified: false,
        custom_domain_billed_until: null,
      },
      { onConflict: 'business_id' }
    )

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/publishing')
  await revalidateLiveStore(supabase, businessId)
  return { success: true, data: undefined }
}

export async function verifyDnsAction(domain: string, businessId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  if (!isVercelDomainsConfigured()) {
    return { success: false, error: 'Custom domains chưa được cấu hình trên máy chủ.' }
  }

  try {
    const verifyResult = await verifyProjectDomain(domain)
    const configResult = await getDomainConfig(domain)
    const projectDomain = await getProjectDomain(domain)

    const isVerified =
      verifyResult.verified === true ||
      projectDomain.verified === true ||
      (verifyResult.ok && configResult.ok && configResult.misconfigured === false)

    if (!isVerified && !verifyResult.ok) {
      return {
        success: false,
        error: verifyResult.error || 'DNS chưa được cấu hình đúng. Kiểm tra bản ghi và thử lại sau vài phút.',
      }
    }

    if (!isVerified) {
      return { success: false, error: 'DNS chưa lan truyền. Vui lòng đợi vài phút rồi thử lại.' }
    }

    const adminClient = createAdminClient()
    await (adminClient as any)
      .from('publishing_settings')
      .update({ custom_domain_verified: true })
      .eq('business_id', businessId)

    const billing = await billCustomDomainIfDueAction(businessId)
    if (!billing.success) {
      await (adminClient as any)
        .from('publishing_settings')
        .update({ custom_domain_verified: false })
        .eq('business_id', businessId)
      return { success: false, error: billing.error || 'Không đủ Credits để kích hoạt tên miền.' }
    }

    revalidatePath('/dashboard/publishing')
    await revalidateLiveStore(supabase, businessId)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'Không thể xác minh tên miền. Vui lòng thử lại.' }
  }
}
