'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import dns from 'dns/promises'
import type { PageBlock, PublishingSettings, ThemeSettings, NavbarConfig, FooterConfig } from '@/components/page-builder/types'
import { billCustomDomainIfDueAction } from '@/app/actions/credits'
export type { PublishingSettings } from '@/components/page-builder/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// ─── Load page data ───────────────────────────────────────────────────────────

export async function getPageDataAction(businessId: string): Promise<{
  blocks: PageBlock[]
  publishing: PublishingSettings | null
  theme: ThemeSettings | null
}> {
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
      .single(),
    db.from('theme_settings')
      .select('*')
      .eq('business_id', businessId)
      .single(),
  ])

  return {
    blocks: (blocksRes.data as any) ?? [],
    publishing: pubRes.data ?? null,
    theme: themeRes.data ?? null,
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
  revalidatePath(`/[slug]`)
  return { success: true, data: undefined }
}

// ─── Publishing ───────────────────────────────────────────────────────────────

export async function togglePublishAction(
  businessId: string,
  published: boolean
): Promise<ActionResult<PublishingSettings>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // If we are publishing, we must snapshot the draft state
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  revalidatePath(`/[slug]`)
  return { success: true, data }
}

// ─── Theme ─────────────────────────────────────────────────────────────────────

export async function saveThemeAction(
  businessId: string,
  theme: { primary_color: string; background_color: string; font_family: string; heading_font_family: string }
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
  revalidatePath(`/[slug]`)
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
  revalidatePath(`/[slug]`)
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

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/pages')
  revalidatePath(`/[slug]`)
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
    publishing: pubRes.data ?? null,
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  if ('custom_domain' in fields) {
    fields.custom_domain_verified = false
    fields.custom_domain_billed_until = null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('publishing_settings')
    .upsert(
      { business_id: businessId, ...fields },
      { onConflict: 'business_id' }
    )
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/publishing')
  revalidatePath(`/[slug]`)
  return { success: true, data }
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

// ─── DNS Verification ────────────────────────────────────────────────────────

export async function verifyDnsAction(domain: string, businessId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  try {
    const isApex = domain.split('.').length === 2
    let isConnected = false
    
    if (isApex) {
      const txts = await dns.resolveTxt(`_vercel.${domain}`).catch(() => [])
      const hasTxt = txts.some(t => t.join('').includes(`vc-domain-verify=${businessId.split('-')[0]}`))
      isConnected = hasTxt
    } else {
      const cnames = await dns.resolveCname(domain).catch((): string[] => [])
      isConnected = cnames.some(c =>
        c === 'cname.vercel-dns.com' ||
        c.endsWith('.cname.vercel-dns.com') ||
        c === 'cname.pinit.app'
      )
    }
    
    if (!isConnected) {
      return { success: false, error: 'DNS chưa được cấu hình đúng. Vui lòng kiểm tra lại bản ghi CNAME/TXT.' }
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
    revalidatePath(`/[slug]`)
    return { success: true, data: undefined }
  } catch {
    return { success: false, error: 'DNS chưa lan truyền. Vui lòng thử lại sau vài phút.' }
  }
}
