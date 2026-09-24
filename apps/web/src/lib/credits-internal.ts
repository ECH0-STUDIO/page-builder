/**
 * Internal credit ledger mutations — not exported as server actions.
 * Call only from trusted server code (webhooks, billing RPC fallbacks, admin flows).
 */
import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { CUSTOM_DOMAIN_CREDITS_PER_MONTH } from '@/lib/credit-packs'

/**
 * True when the Postgres function does not exist yet, so callers can fall back
 * to the legacy read-modify-write path until 058_atomic_credit_ledger.sql runs.
 */
function isMissingFunction(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  // PGRST202: PostgREST could not find the function. 42883: undefined_function.
  return error.code === 'PGRST202' || error.code === '42883'
}

function revalidateCreditViews() {
  try {
    revalidatePath('/dashboard/settings/credits')
    revalidatePath('/dashboard/settings/languages')
    revalidatePath('/dashboard')
  } catch {
    // Safe to ignore when called during RSC render.
  }
}

/** Deduct credits from a business balance. Returns false if insufficient balance. */
export async function deductCreditsInternal(
  businessId: string,
  amount: number,
  description: string,
): Promise<{ success: boolean; error?: string; balance?: number }> {
  if (amount <= 0) {
    try {
      const adminClient = createAdminClient()
      const { data } = await (adminClient as any)
        .from('credit_balances')
        .select('balance')
        .eq('business_id', businessId)
        .maybeSingle()
      return { success: true, balance: (data?.balance as number | undefined) ?? 0 }
    } catch {
      return { success: true }
    }
  }

  try {
    const adminClient = createAdminClient()

    const { data: rpcData, error: rpcError } = await (adminClient as any).rpc(
      'deduct_credits_atomic',
      { p_business_id: businessId, p_amount: amount, p_description: description },
    )

    if (!rpcError) {
      const row = Array.isArray(rpcData) ? rpcData[0] : rpcData
      const balance = Number(row?.balance ?? 0)
      if (!row?.ok) {
        return { success: false, error: 'Không đủ Credits. Vui lòng nạp thêm.', balance }
      }
      revalidateCreditViews()
      return { success: true, balance }
    }

    if (!isMissingFunction(rpcError)) {
      console.error('deduct_credits_atomic error:', rpcError)
      return { success: false, error: rpcError.message || 'Failed to deduct credits' }
    }

    // ── Legacy path: only reached before the atomic migration is applied ──
    console.warn('deduct_credits_atomic missing — falling back to non-atomic deduct')

    const { data: currentBalance } = await (adminClient as any)
      .from('credit_balances')
      .select('balance')
      .eq('business_id', businessId)
      .single()

    const balance = (currentBalance?.balance as number | undefined) ?? 0
    if (balance < amount) {
      return { success: false, error: 'Không đủ Credits. Vui lòng nạp thêm.', balance }
    }

    const nextBalance = balance - amount
    const { error: updateError } = await (adminClient as any)
      .from('credit_balances')
      .update({ balance: nextBalance })
      .eq('business_id', businessId)

    if (updateError) {
      return { success: false, error: updateError.message, balance }
    }

    await (adminClient as any).from('credit_transactions').insert({
      business_id: businessId,
      amount: -amount,
      description,
    })

    revalidateCreditViews()
    return { success: true, balance: nextBalance }
  } catch (error) {
    console.error('deductCreditsInternal error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to deduct credits' }
  }
}

/** Credit a business balance (refunds / adjustments). */
export async function grantCreditsInternal(
  businessId: string,
  amount: number,
  description: string,
): Promise<{ success: boolean; error?: string }> {
  if (amount <= 0) return { success: true }

  try {
    const adminClient = createAdminClient()

    const { error: rpcError } = await (adminClient as any).rpc(
      'grant_credits_atomic',
      { p_business_id: businessId, p_amount: amount, p_description: description },
    )

    if (!rpcError) {
      revalidateCreditViews()
      return { success: true }
    }

    if (!isMissingFunction(rpcError)) {
      console.error('grant_credits_atomic error:', rpcError)
      return { success: false, error: rpcError.message || 'Failed to grant credits' }
    }

    // ── Legacy path: only reached before the atomic migration is applied ──
    console.warn('grant_credits_atomic missing — falling back to non-atomic grant')

    const { data: currentBalance } = await (adminClient as any)
      .from('credit_balances')
      .select('balance')
      .eq('business_id', businessId)
      .maybeSingle()

    const balance = (currentBalance?.balance as number | undefined) ?? 0

    if (currentBalance) {
      await (adminClient as any)
        .from('credit_balances')
        .update({ balance: balance + amount })
        .eq('business_id', businessId)
    } else {
      await (adminClient as any)
        .from('credit_balances')
        .insert({ business_id: businessId, balance: amount })
    }

    await (adminClient as any).from('credit_transactions').insert({
      business_id: businessId,
      amount,
      description,
    })

    revalidateCreditViews()
    return { success: true }
  } catch (error) {
    console.error('grantCreditsInternal error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to grant credits' }
  }
}

/**
 * Refund custom-domain charges when DNS was never actually ready.
 * Uses credit_transactions (not only billed_until) so reconnect/disconnect
 * that cleared billing state still gets refunded.
 */
export async function refundUnconfiguredCustomDomainCreditsInternal(
  businessId: string,
  domain: string,
): Promise<{ refunded: boolean; amount: number }> {
  const adminClient = createAdminClient()
  const normalized = domain.toLowerCase().trim()
  if (!normalized) return { refunded: false, amount: 0 }

  const { data: txs, error } = await (adminClient as any)
    .from('credit_transactions')
    .select('amount, description, created_at')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('refundUnconfiguredCustomDomainCreditsInternal query error:', error)
    return { refunded: false, amount: 0 }
  }

  const chargeNeedle = `Tên miền tùy chỉnh (${normalized})`
  let net = 0
  for (const tx of txs ?? []) {
    const desc = String(tx.description ?? '')
    const amount = Number(tx.amount) || 0
    if (amount < 0 && desc.includes(chargeNeedle)) {
      net += amount
      continue
    }
    if (
      amount > 0 &&
      desc.includes(normalized) &&
      (desc.includes('Hoàn Credits tên miền') || desc.includes('Hoàn Credits'))
    ) {
      net += amount
    }
  }

  if (net >= 0) return { refunded: false, amount: 0 }

  const amount = Math.min(-net, CUSTOM_DOMAIN_CREDITS_PER_MONTH)
  const grant = await grantCreditsInternal(
    businessId,
    amount,
    `Hoàn Credits tên miền chưa cấu hình DNS (${normalized})`,
  )
  if (!grant.success) {
    console.error('refundUnconfiguredCustomDomainCreditsInternal grant failed:', grant.error)
    return { refunded: false, amount: 0 }
  }

  await (adminClient as any)
    .from('publishing_settings')
    .update({ custom_domain_billed_until: null })
    .eq('business_id', businessId)
    .eq('custom_domain', normalized)

  return { refunded: true, amount }
}
