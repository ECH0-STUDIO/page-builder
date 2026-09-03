'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { assertOwnerOrManager } from '@/lib/business-auth'
import { deductCreditsInternal } from '@/lib/credits-internal'
import { LOCALE_CREDITS_PER_MONTH } from '@/lib/credit-packs'
import {
  isStoreLocaleCode,
  storeLocaleLabel,
  toStoreLocaleCode,
  type StoreLocaleCode,
} from '@/i18n/store-locales'

export type BusinessLocaleStatus = 'active' | 'past_due' | 'cancelled'

export type BusinessLocaleRow = {
  id: string
  business_id: string
  locale: StoreLocaleCode
  status: BusinessLocaleStatus
  activated_at: string
  next_bill_at: string
  created_at: string
  updated_at: string
}

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function normalizeLocaleRow(row: Record<string, unknown>): BusinessLocaleRow | null {
  const locale = typeof row.locale === 'string' ? row.locale : ''
  if (!isStoreLocaleCode(locale)) return null
  const status = row.status
  if (status !== 'active' && status !== 'past_due' && status !== 'cancelled') return null
  return {
    id: String(row.id),
    business_id: String(row.business_id),
    locale,
    status,
    activated_at: String(row.activated_at),
    next_bill_at: String(row.next_bill_at),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

export async function getBusinessPrimaryLocale(businessId: string): Promise<StoreLocaleCode> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('publishing_settings')
    .select('language')
    .eq('business_id', businessId)
    .maybeSingle()
  return toStoreLocaleCode((data as { language?: string | null } | null)?.language)
}

export async function listBusinessLocalesAction(
  businessId: string,
): Promise<ActionResult<{ primary: StoreLocaleCode; locales: BusinessLocaleRow[] }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  const access = await assertOwnerOrManager(supabase, user.id, businessId)
  if (!access.ok) return { success: false, error: access.error }

  const primary = await getBusinessPrimaryLocale(businessId)
  const { data, error } = await supabase
    .from('business_locales')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: true })

  if (error) return { success: false, error: error.message }

  const locales = ((data ?? []) as Record<string, unknown>[])
    .map(normalizeLocaleRow)
    .filter((row): row is BusinessLocaleRow => row != null)

  return { success: true, data: { primary, locales } }
}

/** Active purchased locales only (excludes primary). Public/server use. */
export async function getActiveBusinessLocales(businessId: string): Promise<StoreLocaleCode[]> {
  const admin = createAdminClient()
  const { data } = await (admin as any)
    .from('business_locales')
    .select('locale')
    .eq('business_id', businessId)
    .eq('status', 'active')

  const out: StoreLocaleCode[] = []
  for (const row of (data ?? []) as { locale?: string }[]) {
    if (isStoreLocaleCode(row.locale)) out.push(row.locale)
  }
  return out
}

/**
 * Purchase (or reactivate) an extra storefront locale.
 * Charges LOCALE_CREDITS_PER_MONTH immediately and sets next_bill_at +30 days.
 */
export async function purchaseLocaleAction(
  businessId: string,
  localeRaw: string,
): Promise<ActionResult<BusinessLocaleRow & { creditBalance: number }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  const access = await assertOwnerOrManager(supabase, user.id, businessId)
  if (!access.ok) return { success: false, error: access.error }

  if (!isStoreLocaleCode(localeRaw)) {
    return { success: false, error: 'Unsupported language' }
  }
  const locale = localeRaw

  const primary = await getBusinessPrimaryLocale(businessId)
  if (locale === primary) {
    return { success: false, error: 'Primary language is already included for free' }
  }

  const admin = createAdminClient()
  const { data: existing } = await (admin as any)
    .from('business_locales')
    .select('*')
    .eq('business_id', businessId)
    .eq('locale', locale)
    .maybeSingle()

  if (existing?.status === 'active') {
    return { success: false, error: 'This language is already active' }
  }

  const label = storeLocaleLabel(locale)
  const deduct = await deductCreditsInternal(
    businessId,
    LOCALE_CREDITS_PER_MONTH,
    `Ngôn ngữ cửa hàng (${label}) — ${LOCALE_CREDITS_PER_MONTH} Credits/tháng`,
  )
  if (!deduct.success) {
    return { success: false, error: deduct.error || 'Insufficient credits' }
  }

  const now = new Date()
  const nextBill = addDays(now, 30).toISOString()
  const payload = {
    business_id: businessId,
    locale,
    status: 'active' as const,
    activated_at: now.toISOString(),
    next_bill_at: nextBill,
    updated_at: now.toISOString(),
  }

  let row: Record<string, unknown> | null = null
  if (existing?.id) {
    const { data, error } = await (admin as any)
      .from('business_locales')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return { success: false, error: error.message }
    row = data as Record<string, unknown>
  } else {
    const { data, error } = await (admin as any)
      .from('business_locales')
      .insert(payload)
      .select()
      .single()
    if (error) return { success: false, error: error.message }
    row = data as Record<string, unknown>
  }

  const normalized = row ? normalizeLocaleRow(row) : null
  if (!normalized) return { success: false, error: 'Failed to save locale' }

  revalidatePath('/dashboard/settings/languages')
  revalidatePath('/dashboard/settings/credits')
  revalidatePath('/dashboard/translations')
  return {
    success: true,
    data: {
      ...normalized,
      creditBalance: typeof deduct.balance === 'number' ? deduct.balance : 0,
    },
  }
}

/** Cancel a purchased locale. Keeps DB row + translations; stops public URLs and renewals. */
export async function cancelLocaleAction(
  businessId: string,
  localeRaw: string,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  const access = await assertOwnerOrManager(supabase, user.id, businessId)
  if (!access.ok) return { success: false, error: access.error }

  if (!isStoreLocaleCode(localeRaw)) {
    return { success: false, error: 'Unsupported language' }
  }

  const admin = createAdminClient()
  const { error } = await (admin as any)
    .from('business_locales')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('business_id', businessId)
    .eq('locale', localeRaw)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/settings/languages')
  revalidatePath('/dashboard/translations')
  return { success: true, data: undefined }
}

/**
 * Update primary storefront language (free). Does not create a business_locales row.
 * Content maps are preserved; URL ownership swaps.
 */
export async function updatePrimaryLocaleAction(
  businessId: string,
  localeRaw: string,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  const access = await assertOwnerOrManager(supabase, user.id, businessId)
  if (!access.ok) return { success: false, error: access.error }

  if (!isStoreLocaleCode(localeRaw)) {
    return { success: false, error: 'Unsupported language' }
  }

  const admin = createAdminClient()
  const { error } = await (admin as any)
    .from('publishing_settings')
    .update({ language: localeRaw })
    .eq('business_id', businessId)

  if (error) return { success: false, error: error.message }

  // If the new primary was a purchased locale, cancel that entitlement (now free as primary).
  await (admin as any)
    .from('business_locales')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('business_id', businessId)
    .eq('locale', localeRaw)
    .eq('status', 'active')

  revalidatePath('/dashboard/settings/languages')
  return { success: true, data: undefined }
}

/**
 * Monthly renewal for all due active locales.
 * On insufficient credits: mark past_due (public URL stops) — translations kept.
 */
export async function billLocalesIfDueAction(
  businessId: string,
): Promise<{ success: boolean; error?: string; billed?: number; suspended?: string[] }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  const access = await assertOwnerOrManager(supabase, user.id, businessId)
  if (!access.ok) return { success: false, error: access.error }

  const admin = createAdminClient()
  const now = new Date()
  const { data: dueRows, error } = await (admin as any)
    .from('business_locales')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', 'active')
    .lte('next_bill_at', now.toISOString())

  if (error) {
    console.error('billLocalesIfDueAction error:', error)
    return { success: true, billed: 0 }
  }

  let billed = 0
  const suspended: string[] = []

  for (const raw of (dueRows ?? []) as Record<string, unknown>[]) {
    const row = normalizeLocaleRow(raw)
    if (!row) continue
    const label = storeLocaleLabel(row.locale)
    const deduct = await deductCreditsInternal(
      businessId,
      LOCALE_CREDITS_PER_MONTH,
      `Ngôn ngữ cửa hàng (${label}) — ${LOCALE_CREDITS_PER_MONTH} Credits/tháng`,
    )
    if (!deduct.success) {
      await (admin as any)
        .from('business_locales')
        .update({ status: 'past_due', updated_at: now.toISOString() })
        .eq('id', row.id)
      suspended.push(row.locale)
      continue
    }

    await (admin as any)
      .from('business_locales')
      .update({
        next_bill_at: addDays(now, 30).toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', row.id)
    billed += 1
  }

  if (billed > 0 || suspended.length > 0) {
    revalidatePath('/dashboard/settings/languages')
    revalidatePath('/dashboard/settings/credits')
  }

  return { success: true, billed, suspended }
}
