'use server'

import { createClient } from '@/lib/supabase/server'
import type { CartItem } from '@/components/page-builder/render/CartContext'

export async function createOrderAction(
  businessId: string,
  tableNumber: string,
  items: CartItem[],
  totalAmount: number,
  notes: string = ''
) {
  const supabase = await createClient()
  const db = supabase

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

  return { success: true, orderId: order.id }
}
