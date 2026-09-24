'use server'

import { createAdminClient } from '@/lib/supabase/server'
import type { CartItem } from '@/components/page-builder/render/CartContext'
import { recordOrderEvent } from '@/lib/order-events'
import { notifyBusinessPush } from '@/lib/push-notify'
import { isBusinessOpenNow, normalizeOpeningHours } from '@/lib/opening-hours'
import { validateAndComputeOrderTotal } from '@/lib/validate-order-total'

/** Generous enough that a busy venue is never blocked, low enough to stop a flood. */
const MAX_ORDERS_PER_BUSINESS_PER_MINUTE = 100
const MAX_ORDERS_PER_TABLE_PER_MINUTE = 10

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** True before 059_order_idempotency.sql has been applied. */
function isMissingColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === '42703' || /client_token/.test(error.message ?? '')
}

/**
 * This endpoint is unauthenticated by design, so cap how fast one business (or
 * one table) can create orders. Fails open: a counting error must never stop a
 * paying diner from ordering.
 */
async function exceedsOrderRate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  businessId: string,
  tableNumber: string,
): Promise<boolean> {
  const since = new Date(Date.now() - 60_000).toISOString()
  try {
    const [businessRes, tableRes] = await Promise.all([
      db.from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gte('created_at', since),
      tableNumber
        ? db.from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .eq('table_number', tableNumber)
          .gte('created_at', since)
        : Promise.resolve({ count: 0 }),
    ])
    if ((businessRes?.count ?? 0) >= MAX_ORDERS_PER_BUSINESS_PER_MINUTE) return true
    if ((tableRes?.count ?? 0) >= MAX_ORDERS_PER_TABLE_PER_MINUTE) return true
    return false
  } catch (error) {
    console.error('exceedsOrderRate check failed, allowing order:', error)
    return false
  }
}

export async function createOrderAction(
  businessId: string,
  tableNumber: string,
  items: CartItem[],
  totalAmount: number,
  notes: string = '',
  /** Per-checkout-attempt token so retries and double-taps resolve to one order. */
  clientToken?: string,
) {
  const db = createAdminClient()
  const token = typeof clientToken === 'string' && UUID_RE.test(clientToken) ? clientToken : null

  // Replay of an attempt we already accepted — return the original order.
  if (token) {
    const { data: existing, error: lookupError } = await db
      .from('orders')
      .select('id')
      .eq('client_token', token)
      .maybeSingle()
    if (!lookupError && existing?.id) {
      return { success: true, orderId: existing.id as string, duplicate: true }
    }
  }

  const validated = await validateAndComputeOrderTotal(db, businessId, items)
  if (!validated.ok) {
    return { success: false, error: validated.error }
  }

  if (validated.total !== Math.round(totalAmount)) {
    return { success: false, error: 'Order total mismatch' }
  }

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

  const orderTotal = validated.total

  const flood = await exceedsOrderRate(db, businessId, tableNumber)
  if (flood) {
    return { success: false, error: 'TOO_MANY_ORDERS', code: 'TOO_MANY_ORDERS' as const }
  }

  // 1. Create the order
  const baseRow = {
    business_id: businessId,
    table_number: tableNumber || null,
    total_amount: orderTotal,
    notes: notes || null,
    status: 'pending',
    payment_status: 'unpaid',
  }

  let { data: order, error: orderError } = await db
    .from('orders')
    .insert({ ...baseRow, ...(token ? { client_token: token } : {}) })
    .select('id')
    .single()

  // 42703: client_token does not exist yet (migration 059 not applied). Ordering
  // must never break on deploy order, so retry without the idempotency key.
  if (orderError && token && isMissingColumn(orderError)) {
    console.warn('orders.client_token missing — inserting without idempotency key')
    ;({ data: order, error: orderError } = await db
      .from('orders')
      .insert(baseRow)
      .select('id')
      .single())
  }

  if (orderError || !order) {
    // 23505: another in-flight call with the same token won the race.
    if (token && orderError?.code === '23505') {
      const { data: winner } = await db
        .from('orders')
        .select('id')
        .eq('client_token', token)
        .maybeSingle()
      if (winner?.id) {
        return { success: true, orderId: winner.id as string, duplicate: true }
      }
    }
    return { success: false, error: orderError?.message ?? 'Failed to create order' }
  }

  // 2. Create the order items (server-validated prices)
  const orderItemsData = validated.lines.map(line => ({
    order_id: order.id,
    item_id: line.itemId,
    item_name: line.itemName,
    quantity: line.quantity,
    unit_price: line.unitPrice,
    options: line.variants.length > 0 ? line.variants : null,
  }))

  const { error: itemsError } = await db
    .from('order_items')
    .insert(orderItemsData)

  if (itemsError) {
    // Never leave a header with no lines — the kitchen would see an empty ticket.
    await db.from('orders').delete().eq('id', order.id)
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
      total_amount: orderTotal,
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
