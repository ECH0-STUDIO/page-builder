/**
 * Recurring-billing cores with no auth check.
 *
 * These were only reachable through server actions called while rendering a
 * dashboard page, so a domain or a language renewed when — and only when — the
 * owner happened to open the right screen. An owner who never visited Publishing
 * again kept a paid custom domain for free. Splitting the work out lets the cron
 * route in /api/cron/billing run the same code on a schedule.
 *
 * The server actions still wrap these with an ownership check; the cron route
 * authenticates with CRON_SECRET.
 */

import 'server-only'
import { createAdminClient } from '@/lib/supabase/server'
import {
  deductCreditsInternal,
  grantCreditsInternal,
  refundUnconfiguredCustomDomainCreditsInternal,
} from '@/lib/credits-internal'
import { CUSTOM_DOMAIN_CREDITS_PER_MONTH, LOCALE_CREDITS_PER_MONTH } from '@/lib/credit-packs'
import { assessDomainConnection, isVercelDomainsConfigured } from '@/lib/vercel-domains'
import { isStoreLocaleCode, storeLocaleLabel } from '@/i18n/store-locales'

export type DomainBillingResult = {
  success: boolean
  error?: string
  billed?: boolean
  suspended?: boolean
}

/** Bill custom domain hosting (50 credits / 30 days). Idempotent until billed_until expires. */
export async function billCustomDomainForBusiness(businessId: string): Promise<DomainBillingResult> {
  const adminClient = createAdminClient()

  const { data: pub } = await (adminClient as any)
    .from('publishing_settings')
    .select('custom_domain, custom_domain_verified, custom_domain_billed_until')
    .eq('business_id', businessId)
    .maybeSingle()

  if (!pub?.custom_domain) {
    return { success: true, billed: false }
  }

  // Only suspend when the domain left Vercel / ownership was revoked — not when
  // Cloudflare proxy makes the config API report misconfigured.
  if (isVercelDomainsConfigured()) {
    try {
      const assessment = await assessDomainConnection(pub.custom_domain)
      if (!assessment.stable) {
        if (pub.custom_domain_verified) {
          await (adminClient as any)
            .from('publishing_settings')
            .update({ custom_domain_verified: false, custom_domain_billed_until: null })
            .eq('business_id', businessId)
        }
        await refundUnconfiguredCustomDomainCreditsInternal(businessId, pub.custom_domain)
        return { success: true, billed: false, suspended: true }
      }
    } catch (error) {
      console.error('billCustomDomainForBusiness DNS check error:', error)
      // Do not charge or suspend when we cannot reach Vercel.
      return { success: true, billed: false }
    }
  }

  if (!pub.custom_domain_verified) {
    return { success: true, billed: false }
  }

  const billedUntil = pub.custom_domain_billed_until ? new Date(pub.custom_domain_billed_until) : null
  if (billedUntil && billedUntil > new Date()) {
    return { success: true, billed: false }
  }

  const deduct = await deductCreditsInternal(
    businessId,
    CUSTOM_DOMAIN_CREDITS_PER_MONTH,
    `Tên miền tùy chỉnh (${pub.custom_domain}) — ${CUSTOM_DOMAIN_CREDITS_PER_MONTH} Credits/tháng`,
  )

  if (!deduct.success) {
    // Stop serving unpaid domains until the owner tops up and re-verifies.
    await (adminClient as any)
      .from('publishing_settings')
      .update({ custom_domain_verified: false })
      .eq('business_id', businessId)
    return { success: false, error: deduct.error, suspended: true }
  }

  const nextBill = new Date()
  nextBill.setDate(nextBill.getDate() + 30)

  const { error: cycleError } = await (adminClient as any)
    .from('publishing_settings')
    .update({ custom_domain_billed_until: nextBill.toISOString() })
    .eq('business_id', businessId)

  // Without an advanced billed_until the next run charges again.
  if (cycleError) {
    console.error('billCustomDomainForBusiness cycle update failed, refunding:', cycleError)
    await grantCreditsInternal(
      businessId,
      CUSTOM_DOMAIN_CREDITS_PER_MONTH,
      'Hoàn Credits tên miền (không cập nhật được chu kỳ)',
    )
    return { success: false, error: cycleError.message }
  }

  return { success: true, billed: true }
}

export type LocaleBillingResult = {
  success: boolean
  error?: string
  billed?: number
  suspended?: string[]
}

/** Monthly renewal for due active locales. Insufficient credits → past_due, translations kept. */
export async function billLocalesForBusiness(businessId: string): Promise<LocaleBillingResult> {
  const admin = createAdminClient()
  const now = new Date()

  const { data: dueRows, error } = await (admin as any)
    .from('business_locales')
    .select('id, locale')
    .eq('business_id', businessId)
    .eq('status', 'active')
    .lte('next_bill_at', now.toISOString())

  if (error) {
    console.error('billLocalesForBusiness error:', error)
    return { success: true, billed: 0 }
  }

  let billed = 0
  const suspended: string[] = []

  for (const row of (dueRows ?? []) as { id: string; locale: string }[]) {
    if (!isStoreLocaleCode(row.locale)) continue
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

    const nextBill = new Date(now)
    nextBill.setDate(nextBill.getDate() + 30)

    const { error: cycleError } = await (admin as any)
      .from('business_locales')
      .update({ next_bill_at: nextBill.toISOString(), updated_at: now.toISOString() })
      .eq('id', row.id)

    // Refund rather than charge again on the next run.
    if (cycleError) {
      console.error('billLocalesForBusiness cycle update failed, refunding:', cycleError)
      await grantCreditsInternal(
        businessId,
        LOCALE_CREDITS_PER_MONTH,
        `Hoàn Credits ngôn ngữ ${label} (không cập nhật được chu kỳ)`,
      )
      continue
    }

    billed += 1
  }

  return { success: true, billed, suspended }
}
