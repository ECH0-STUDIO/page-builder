'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const CUSTOM_DOMAIN_CREDITS_PER_MONTH = 50
const STORAGE_CREDITS_PER_20MB = 1

export async function getCreditBalanceAction(businessId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const adminClient = createAdminClient()
    const { data, error } = await (adminClient as any)
      .from('credit_balances')
      .select('balance')
      .eq('business_id', businessId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No balance yet
        return { success: true, data: 0 }
      }
      throw error
    }

    return { success: true, data: data.balance }
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

    const { data, error } = await (supabase as any)
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

/** Deduct credits from a business balance. Returns false if insufficient balance. */
export async function deductCreditsAction(
  businessId: string,
  amount: number,
  description: string
): Promise<{ success: boolean; error?: string }> {
  if (amount <= 0) return { success: true }

  try {
    const adminClient = createAdminClient()

    const { data: currentBalance } = await (adminClient as any)
      .from('credit_balances')
      .select('balance')
      .eq('business_id', businessId)
      .single()

    const balance = (currentBalance?.balance as number | undefined) ?? 0
    if (balance < amount) {
      return { success: false, error: 'Không đủ Credits. Vui lòng nạp thêm.' }
    }

    await (adminClient as any)
      .from('credit_balances')
      .update({ balance: balance - amount })
      .eq('business_id', businessId)

    await (adminClient as any).from('credit_transactions').insert({
      business_id: businessId,
      amount: -amount,
      description,
    })

    revalidatePath('/dashboard/settings/credits')
    return { success: true }
  } catch (error) {
    console.error('deductCreditsAction error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to deduct credits' }
  }
}

/** Bill custom domain hosting (50 credits / 30 days) after DNS is verified. */
export async function billCustomDomainIfDueAction(businessId: string): Promise<{ success: boolean; error?: string; billed?: boolean }> {
  const adminClient = createAdminClient()

  const { data: pub } = await (adminClient as any)
    .from('publishing_settings')
    .select('custom_domain, custom_domain_verified, custom_domain_billed_until')
    .eq('business_id', businessId)
    .single()

  if (!pub?.custom_domain || !pub.custom_domain_verified) {
    return { success: true, billed: false }
  }

  const billedUntil = pub.custom_domain_billed_until ? new Date(pub.custom_domain_billed_until) : null
  if (billedUntil && billedUntil > new Date()) {
    return { success: true, billed: false }
  }

  const deduct = await deductCreditsAction(
    businessId,
    CUSTOM_DOMAIN_CREDITS_PER_MONTH,
    `Tên miền tùy chỉnh (${pub.custom_domain}) — ${CUSTOM_DOMAIN_CREDITS_PER_MONTH} Credits/tháng`
  )

  if (!deduct.success) return deduct

  const nextBill = new Date()
  nextBill.setDate(nextBill.getDate() + 30)

  await (adminClient as any)
    .from('publishing_settings')
    .update({ custom_domain_billed_until: nextBill.toISOString() })
    .eq('business_id', businessId)

  return { success: true, billed: true }
}

/** Bill gallery storage (1 credit per 20 MB) when the billing cycle is due. */
export async function billStorageIfDueAction(
  businessId: string,
  usedBytes: number
): Promise<{ success: boolean; error?: string; billed?: boolean; creditsCharged?: number }> {
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
  const creditsNeeded = Math.max(1, Math.ceil(usedMb / 20))

  const deduct = await deductCreditsAction(
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

    // Make sure they have permission to buy credits
    const { data: business } = await supabase
      .from('businesses')
      .select('owner_id')
      .eq('id', businessId)
      .single()

    if (!business) {
      return { success: false, error: 'Business not found' }
    }

    if (business.owner_id !== user.id) {
      return { success: false, error: 'Only owners can purchase credits' }
    }

    const adminClient = createAdminClient()

    let finalPrice = priceVnd
    let appliedDiscountId = null
    let appliedDiscountAmount = 0

    if (discountCode) {
      const verifyRes = await verifyDiscountCodeAction(discountCode, priceVnd)
      if (!verifyRes.success) {
        return { success: false, error: verifyRes.error }
      }
      finalPrice = verifyRes.newPrice || 0
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
        amount_credits: amount,
        price_vnd: finalPrice, // Use final price
        status: finalPrice === 0 ? 'paid' : 'pending',
        order_code: orderCode,
        discount_code_id: appliedDiscountId,
        discount_amount: appliedDiscountAmount
      })

    if (orderError) throw orderError

    // 1.5 If price is 0, fulfill order instantly without PayOS
    if (finalPrice === 0) {
      // Add balance
      const { data: currentBalance } = await (adminClient as any)
        .from('credit_balances')
        .select('balance')
        .eq('business_id', businessId)
        .single()
      
      const newBalance = (currentBalance?.balance || 0) + amount

      await (adminClient as any)
        .from('credit_balances')
        .update({ balance: newBalance })
        .eq('business_id', businessId)
      
      // Update discount usage
      if (appliedDiscountId) {
        await (adminClient as any).rpc('increment_discount_uses', { d_id: appliedDiscountId })
      }

      // Log transaction
      await (adminClient as any)
        .from('credit_transactions')
        .insert({
          business_id: businessId,
          amount: amount,
          description: `Mua ${amount} Credits (Mã giảm giá: ${discountCode})`
        })

      return { success: true, checkoutUrl: null, instantSuccess: true }
    }

    // 2. Create PayOS payment link
    const { payos } = await import('@/lib/payos')
    const DOMAIN = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    const requestData = {
      orderCode: orderCode,
      amount: finalPrice,
      description: `Mua ${amount} Credits`,
      returnUrl: `${DOMAIN}/dashboard/settings/credits?status=success`,
      cancelUrl: `${DOMAIN}/dashboard/settings/credits?status=cancel`
    }

    const paymentLinkData = await payos.paymentRequests.create(requestData)

    return { success: true, checkoutUrl: paymentLinkData.checkoutUrl }
  } catch (error: any) {
    console.error('purchaseCreditsAction error:', error)
    return { success: false, error: error.message }
  }
}
