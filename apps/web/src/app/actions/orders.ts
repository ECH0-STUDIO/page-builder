'use server'

import { createAdminClient } from '@/lib/supabase/server'
import type { CartItem } from '@/components/page-builder/render/CartContext'
import { recordOrderEvent } from '@/lib/order-events'
import { notifyBusinessPush } from '@/lib/push-notify'
import { isBusinessOpenNow, normalizeOpeningHours } from '@/lib/opening-hours'

export async function createOrderAction(
  businessId: string,
  tableNumber: string,
  items: CartItem[],
  totalAmount: number,
  notes: string = ''
) {
  const db = createAdminClient()

  const { data: business, error: businessError } = await db
    .from('businesses')
    .select('opening_hours')
    .eq('id', businessId)
    .maybeSingle()

  if (businessError) {
    return { success: false, error: businessError.message }
  }

  const hours = normalizeOpeningHours(business?.opening_hours)
  if (!isBusinessOpenNow(hours)) {
    return {
      success: false,
      error: 'CLOSED',
      code: 'CLOSED' as const,
    }
  }

  // 1. Create the order
  const { data: order, error: orderError } = await db
    .from('orders')
    .insert({
      business_id: businessId,
      table_number: tableNumber || null,
      total_amount: totalAmount,
      notes: notes || null,
      status: 'pending',
      payment_status: 'unpaid'
    })
    .select('id')
    .single()

  if (orderError) {
    return { success: false, error: orderError.message }
  }

  // 2. Create the order items
  const orderItemsData = items.map(item => ({
    order_id: order.id,
    item_id: item.itemId,
    item_name: item.itemName,
    quantity: item.quantity,
    unit_price: item.totalPrice, // cart totalPrice is per-unit (with modifiers)
    options: item.variants.length > 0 ? item.variants : null,
  }))

  const { error: itemsError } = await db
    .from('order_items')
    .insert(orderItemsData)

  if (itemsError) {
    return { success: false, error: itemsError.message }
  }

  await recordOrderEvent({
    businessId,
    orderId: order.id,
    entityType: 'order',
    entityId: order.id,
    action: 'created',
    actorName: 'Customer',
    actorRole: 'customer',
    after: {
      table_number: tableNumber || null,
      total_amount: totalAmount,
      item_count: items.length,
    },
  })

  void notifyBusinessPush(businessId, {
    title: 'New order',
    body: tableNumber
      ? `Table ${tableNumber} · ${items.length} item(s)`
      : `Takeaway · ${items.length} item(s)`,
    url: '/dashboard/orders',
  })

  return { success: true, orderId: order.id }
}
