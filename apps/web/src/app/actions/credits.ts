'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { assertOwnerOrManager } from '@/lib/business-auth'
import { deductCreditsInternal, grantCreditsInternal, refundUnconfiguredCustomDomainCreditsInternal } from '@/lib/credits-internal'
import {
  CREDIT_PACKS,
  CUSTOM_DOMAIN_CREDITS_PER_MONTH,
  PAGE_VIEWS_PER_CREDIT,
  STORAGE_CREDITS_PER_20MB,
  findCreditPack,
} from '@/lib/credit-packs'
import { assessDomainConnection, isVercelDomainsConfigured } from '@/lib/vercel-domains'

export async function getCreditBalanceAction(businessId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const access = await assertOwnerOrManager(supabase, user.id, businessId)
    if (!access.ok) return { success: false, error: access.error }

    const { data, error } = await supabase
      .from('credit_balances')
      .select('balance')
      .eq('business_id', businessId)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') {
        // No balance yet
        return { success: true, data: 0 }
      }
      throw error
    }

    const balance = (data as { balance?: number } | null)?.balance
    return { success: true, data: balance ?? 0 }
  } catch (error: any) {
    console.error('getCreditBalanceAction error:', error)
    return { success: false, error: error.message }
  }
}

export async function getCreditTransactionsAction(businessId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const access = await assertOwnerOrManager(supabase, user.id, businessId)
    if (!access.ok) return { success: false, error: access.error }

    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error('getCreditTransactionsAction error:', error)
    return { success: false, error: error.message }
  }
}

export async function verifyDiscountCodeAction(code: string, packagePrice: number) {
  try {
    const adminClient = createAdminClient()
    const { data: discount, error } = await (adminClient as any)
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (error || !discount) {
      return { success: false, error: 'Mã giảm giá không hợp lệ' } // Invalid discount code
    }

    if (!discount.is_active) {
      return { success: false, error: 'Mã giảm giá đã hết hạn hoặc không hoạt động' }
    }

    if (discount.max_uses !== null && discount.used_count >= discount.max_uses) {
      return { success: false, error: 'Mã giảm giá đã hết lượt sử dụng' }
    }

    let discountAmount = 0
    if (discount.discount_type === 'percent') {
      discountAmount = Math.floor(packagePrice * (discount.discount_value / 100))
    } else if (discount.discount_type === 'fixed') {
      discountAmount = discount.discount_value
    }

    // Ensure we don't discount more than the price
    discountAmount = Math.min(discountAmount, packagePrice)
    const newPrice = packagePrice - discountAmount

    return { 
      success: true, 
      discountAmount, 
      newPrice, 
      discountId: discount.id 
    }
  } catch (error: any) {
    console.error('verifyDiscountCodeAction error:', error)
    return { success: false, error: error.message }
  }
}

/** @deprecated Not callable from clients — use internal billing paths only. */
export async function deductCreditsAction(): Promise<{ success: false; error: string }> {
  return { success: false, error: 'Forbidden' }
}

/** @deprecated Not callable from clients — use internal billing paths only. */
export async function grantCreditsAction(): Promise<{ success: false; error: string }> {
  return { success: false, error: 'Forbidden' }
}

/**
 * Refund custom-domain charges when DNS was never actually ready.
 * @deprecated Not callable from clients — use refundUnconfiguredCustomDomainCreditsInternal.
 */
export async function refundUnconfiguredCustomDomainCredits(): Promise<{ refunded: false; amount: 0 }> {
  return { refunded: false, amount: 0 }
}

/**
 * Refund any unreimbursed custom-domain charges for this business.
 * Safe when the domain was disconnected after a false verification charge.
 */
export async function refundPendingCustomDomainCharges(
  businessId: string,
): Promise<{ refunded: boolean; amount: number; domains: string[] }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { refunded: false, amount: 0, domains: [] }
  const access = await assertOwnerOrManager(supabase, user.id, businessId)
  if (!access.ok) return { refunded: false, amount: 0, domains: [] }

  const adminClient = createAdminClient()
  const { data: txs, error } = await (adminClient as any)
    .from('credit_transactions')
    .select('amount, description')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('refundPendingCustomDomainCharges query error:', error)
    return { refunded: false, amount: 0, domains: [] }
  }

  const domains = new Set<string>()
  for (const tx of txs ?? []) {
    const desc = String(tx.description ?? '')
    const amount = Number(tx.amount) || 0
    if (amount >= 0) continue
    const match = desc.match(/Tên miền tùy chỉnh \(([^)]+)\)/i)
    if (match?.[1]) domains.add(match[1].toLowerCase().trim())
  }

  const { data: pub } = await (adminClient as any)
    .from('publishing_settings')
    .select('custom_domain, custom_domain_verified')
    .eq('business_id', businessId)
    .maybeSingle()

  let total = 0
  const refundedDomains: string[] = []

  for (const domain of domains) {
    const isActiveVerified =
      pub?.custom_domain === domain && pub?.custom_domain_verified === true

    if (isActiveVerified && isVercelDomainsConfigured()) {
      try {
        const assessment = await assessDomainConnection(domain)
        if (assessment.ready) continue
      } catch {
        // Fall through to refund when DNS cannot be confirmed.
      }
    }

    const result = await refundUnconfiguredCustomDomainCreditsInternal(businessId, domain)
    if (result.refunded) {
      total += result.amount
      refundedDomains.push(domain)
    }
  }

  return { refunded: total > 0, amount: total, domains: refundedDomains }
}

/**
 * Bill custom domain hosting (50 credits / 30 days) while a verified domain is in use.
 * Idempotent until billed_until expires. No cron required — call from dashboard / verify.
 * On insufficient credits, suspends the domain (unverify) so it stops resolving.
 * Re-checks Vercel DNS before charging so ownership-only "verified" domains are not billed.
 */
export async function billCustomDomainIfDueAction(businessId: string): Promise<{ success: boolean; error?: string; billed?: boolean; suspended?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  const access = await assertOwnerOrManager(supabase, user.id, businessId)
  if (!access.ok) return { success: false, error: access.error }

  const adminClient = createAdminClient()

  const { data: pub } = await (adminClient as any)
    .from('publishing_settings')
    .select('custom_domain, custom_domain_verified, custom_domain_billed_until')
    .eq('business_id', businessId)
    .single()

  if (!pub?.custom_domain) {
    return { success: true, billed: false }
  }

  // Never bill (and unverify) if DNS is not pointing at Vercel.
  // Also refund unreimbursed charges even when already unverified.
  if (isVercelDomainsConfigured()) {
    try {
      const assessment = await assessDomainConnection(pub.custom_domain)
      if (!assessment.ready) {
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
      console.error('billCustomDomainIfDueAction DNS check error:', error)
      // Do not charge when we cannot confirm DNS is ready.
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
    `Tên miền tùy chỉnh (${pub.custom_domain}) — ${CUSTOM_DOMAIN_CREDITS_PER_MONTH} Credits/tháng`
  )

  if (!deduct.success) {
    // Stop serving unpaid domains until owner tops up and re-verifies
    await (adminClient as any)
      .from('publishing_settings')
      .update({ custom_domain_verified: false })
      .eq('business_id', businessId)
    return { success: false, error: deduct.error, suspended: true }
  }

  const nextBill = new Date()
  nextBill.setDate(nextBill.getDate() + 30)

  await (adminClient as any)
    .from('publishing_settings')
    .update({ custom_domain_billed_until: nextBill.toISOString() })
    .eq('business_id', businessId)

  return { success: true, billed: true }
}

/**
 * Reconcile page-view credit charges (1 credit / 500 views).
 * Primary billing happens in /api/view via RPC; this is a dashboard safety net.
 */
export async function billPageViewsIfDueAction(
  businessId: string
): Promise<{ success: boolean; error?: string; billed?: boolean; creditsCharged?: number }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }
    const access = await assertOwnerOrManager(supabase, user.id, businessId)
    if (!access.ok) return { success: false, error: access.error }

    const adminClient = createAdminClient()
    const { data, error } = await (adminClient as any).rpc('bill_page_views_due', {
      p_business_id: businessId,
      p_views_per_credit: PAGE_VIEWS_PER_CREDIT,
    })

    if (error) {
      // Migration may not be applied yet — don't break dashboard
      console.error('billPageViewsIfDueAction rpc error:', error)
      return { success: true, billed: false }
    }

    const row = Array.isArray(data) ? data[0] : data
    const charged = Number(row?.credits_charged ?? 0)
    if (charged > 0) {
      revalidatePath('/dashboard/settings/credits')
    }
    return { success: true, billed: charged > 0, creditsCharged: charged }
  } catch (error) {
    console.error('billPageViewsIfDueAction error:', error)
    return { success: true, billed: false }
  }
}

/** Bill gallery storage (1 credit per 20 MB) when the billing cycle is due. */
export async function billStorageIfDueAction(
  businessId: string,
  usedBytes: number
): Promise<{ success: boolean; error?: string; billed?: boolean; creditsCharged?: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }
  const access = await assertOwnerOrManager(supabase, user.id, businessId)
  if (!access.ok) return { success: false, error: access.error }

  const adminClient = createAdminClient()

  const { data: sub } = await (adminClient as any)
    .from('storage_subscriptions')
    .select('*')
    .eq('business_id', businessId)
    .single()

  if (!sub) return { success: true, billed: false }

  const nextBilling = new Date(sub.next_billing_date)
  if (nextBilling > new Date()) {
    return { success: true, billed: false }
  }

  const usedMb = Math.max(usedBytes / (1024 * 1024), 20)
  const creditsNeeded = Math.max(1, Math.ceil(usedMb / 20) * STORAGE_CREDITS_PER_20MB)

  const deduct = await deductCreditsInternal(
    businessId,
    creditsNeeded,
    `Lưu trữ ảnh — ${Math.round(usedMb)} MB (${creditsNeeded} Credits)`
  )

  if (!deduct.success) return deduct

  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + 30)

  await (adminClient as any)
    .from('storage_subscriptions')
    .update({
      current_quota_mb: Math.ceil(usedMb),
      next_billing_date: nextDate.toISOString(),
    })
    .eq('business_id', businessId)

  return { success: true, billed: true, creditsCharged: creditsNeeded }
}

// Start PayOS checkout session
export async function purchaseCreditsAction(businessId: string, amount: number, priceVnd: number, discountCode?: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const access = await assertOwnerOrManager(supabase, user.id, businessId)
    if (!access.ok) return { success: false, error: access.error }

    // Server-side pack whitelist — never trust client price/amount
    const pack = findCreditPack(amount)
    if (!pack || pack.priceVnd !== priceVnd) {
      return {
        success: false,
        error: `Gói Credits không hợp lệ. Chọn một trong: ${CREDIT_PACKS.map(p => p.amount).join(', ')}.`,
      }
    }
    const listPrice: number = pack.priceVnd

    const adminClient = createAdminClient()

    let finalPrice: number = listPrice
    let appliedDiscountId = null
    let appliedDiscountAmount = 0

    if (discountCode) {
      const verifyRes = await verifyDiscountCodeAction(discountCode, listPrice)
      if (!verifyRes.success) {
        return { success: false, error: verifyRes.error }
      }
      finalPrice = verifyRes.newPrice ?? 0
      appliedDiscountId = verifyRes.discountId
      appliedDiscountAmount = verifyRes.discountAmount || 0
    }

    // Round up to minimum 2000 VND if price is > 0 but < 2000
    if (finalPrice > 0 && finalPrice < 2000) {
      finalPrice = 2000
    }

    // Generate unique order code (numeric)
    const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000))

    // 1. Create pending order in database
    const { error: orderError } = await (adminClient as any)
      .from('credit_orders')
      .insert({
        business_id: businessId,
        amount_credits: pack.amount,
        price_vnd: finalPrice,
        status: 'pending',
        order_code: orderCode,
        discount_code_id: appliedDiscountId,
        discount_amount: appliedDiscountAmount,
      })

    if (orderError) throw orderError

    // 1.5 If price is 0, fulfill instantly without PayOS (same atomic path as webhook)
    if (finalPrice === 0) {
      const { data: fulfilled, error: fulfillError } = await (adminClient as any).rpc(
        'fulfill_credit_order',
        { p_order_code: orderCode },
      )
      if (fulfillError || !fulfilled) {
        throw new Error(fulfillError?.message || 'Failed to fulfill free credit order')
      }
      revalidatePath('/dashboard/settings/credits')
      return { success: true, checkoutUrl: null, instantSuccess: true }
    }

    // 2. Create PayOS payment link — return to the app host (not marketing site)
    const { payos } = await import('@/lib/payos')
    const { getAppBaseUrl } = await import('@/lib/site-urls')
    const appBase = getAppBaseUrl()

    const requestData = {
      orderCode: orderCode,
      amount: finalPrice,
      description: `Mua ${pack.amount} Credits`,
      returnUrl: `${appBase}/dashboard/settings/credits?status=success`,
      cancelUrl: `${appBase}/dashboard/settings/credits?status=cancel`,
    }

    const paymentLinkData = await payos.paymentRequests.create(requestData)

    return { success: true, checkoutUrl: paymentLinkData.checkoutUrl }
  } catch (error: any) {
    console.error('purchaseCreditsAction error:', error)
    return { success: false, error: error.message }
  }
}
