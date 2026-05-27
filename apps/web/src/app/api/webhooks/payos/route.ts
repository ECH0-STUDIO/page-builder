import { NextRequest, NextResponse } from 'next/server'
import { payos } from '@/lib/payos'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('PayOS Webhook received:', body)

    // Verify webhook data
    const webhookData = payos.verifyPaymentWebhookData(body)

    if (webhookData.code === '00' && webhookData.success) {
      const orderCode = webhookData.orderCode

      const adminClient = createAdminClient()

      // 1. Get the order
      const { data: order, error: orderError } = await (adminClient as any)
        .from('credit_orders')
        .select('*')
        .eq('order_code', orderCode)
        .single()

      if (orderError || !order) {
        console.error('Order not found:', orderCode)
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      if (order.status === 'paid') {
        // Already processed
        return NextResponse.json({ success: true, message: 'Already processed' })
      }

      // 2. Mark order as paid
      await (adminClient as any)
        .from('credit_orders')
        .update({ status: 'paid' })
        .eq('id', order.id)

      // 3. Add to balance
      const { data: currentBalance } = await (adminClient as any)
        .from('credit_balances')
        .select('balance')
        .eq('business_id', order.business_id)
        .single()

      const newBalance = (currentBalance?.balance || 0) + order.amount_credits

      await (adminClient as any)
        .from('credit_balances')
        .update({ balance: newBalance })
        .eq('business_id', order.business_id)

      // 4. Log transaction
      await (adminClient as any)
        .from('credit_transactions')
        .insert({
          business_id: order.business_id,
          amount: order.amount_credits,
          description: `PayOS Payment (Order ${orderCode})`,
        })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 })

  } catch (error: any) {
    console.error('PayOS Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
