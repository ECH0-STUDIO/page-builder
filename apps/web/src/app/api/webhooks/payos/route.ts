import { NextRequest, NextResponse } from 'next/server'
import { payos } from '@/lib/payos'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('PayOS Webhook received:', body)

    // Verify webhook data
    const webhookData = (await payos.webhooks.verify(body)) as any

    // If it's a webhook verification ping
    if (webhookData.webhookUrl) {
      return NextResponse.json({ success: true, message: 'Webhook confirmed' })
    }

    if (webhookData.code === '00') {
      const orderCode = webhookData.orderCode
      const adminClient = createAdminClient()

      // Atomic fulfill: pending → paid + credit balance (idempotent if already paid)
      const { data: fulfilled, error: fulfillError } = await (adminClient as any).rpc(
        'fulfill_credit_order',
        { p_order_code: orderCode },
      )

      if (fulfillError) {
        console.error('fulfill_credit_order error:', fulfillError)
        return NextResponse.json({ error: fulfillError.message }, { status: 500 })
      }

      if (!fulfilled) {
        console.error('Order not found or not fulfillable:', orderCode)
        // Soft-ack so PayOS stops retrying invalid / test webhooks
        return NextResponse.json({ success: true, message: 'Order not found (test webhook)' })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 })
  } catch (error: any) {
    console.error('PayOS Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
