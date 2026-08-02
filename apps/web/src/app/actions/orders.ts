'use server'

import { createAdminClient } from '@/lib/supabase/server'
import type { CartItem } from '@/components/page-builder/render/CartContext'
import { recordOrderEvent } from '@/lib/order-events'
import { notifyBusinessPush } from '@/lib/push-notify'

export async function createOrderAction(
  businessId: string,
  tableNumber: string,
  items: CartItem[],
  totalAmount: number,
  notes: string = ''
) {
  const db = createAdminClient()

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
    unit_price: item.totalPrice, // Note: cart item totalPrice is actually unit price * modifiers, but wait: in CartContext totalPrice is the single unit price!
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
