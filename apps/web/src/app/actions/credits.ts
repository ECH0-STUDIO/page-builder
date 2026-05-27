'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

// Start PayOS checkout session
export async function purchaseCreditsAction(businessId: string, amount: number, priceVnd: number) {
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

    // Generate unique order code (numeric)
    const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000))

    // 1. Create pending order in database
    const { error: orderError } = await (adminClient as any)
      .from('credit_orders')
      .insert({
        business_id: businessId,
        amount_credits: amount,
        price_vnd: priceVnd,
        status: 'pending',
        order_code: orderCode
      })

    if (orderError) throw orderError

    // 2. Create PayOS payment link
    const { payos } = await import('@/lib/payos')
    const DOMAIN = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    const requestData = {
      orderCode: orderCode,
      amount: priceVnd,
      description: `Mua ${amount} Credits`,
      returnUrl: `${DOMAIN}/dashboard/settings?status=success`,
      cancelUrl: `${DOMAIN}/dashboard/settings?status=cancel`
    }

    const paymentLinkData = await payos.createPaymentLink(requestData)

    return { success: true, checkoutUrl: paymentLinkData.checkoutUrl }
  } catch (error: any) {
    console.error('purchaseCreditsAction error:', error)
    return { success: false, error: error.message }
  }
}
