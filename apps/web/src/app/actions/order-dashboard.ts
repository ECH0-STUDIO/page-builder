'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/business-server'
import { recordOrderEvent } from '@/lib/order-events'
import {
  formatOrderLogActionEn,
  formatOrderLogDetailEn,
  getServiceRequestMeta,
} from '@/lib/order-log-format'
import {
  getOrderRetentionCutoffIso,
} from '@/lib/order-retention'

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

type Actor = {
  userId: string
  name: string
  role: string
  businessId: string
}

async function requireTeamActor(businessId: string): Promise<ActionResult<Actor>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { business, role } = await getActiveBusiness(supabase, user.id)
  if (!business || business.id !== businessId) {
    return { success: false, error: 'No access to this business' }
  }
  if (!role || !['owner', 'manager', 'staff'].includes(role)) {
    return { success: false, error: 'Insufficient permissions' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  return {
    success: true,
    data: {
      userId: user.id,
      name: profile?.full_name || user.email || 'Team member',
      role,
      businessId,
    },
  }
}

function canViewHistory(role: string | null | undefined): boolean {
  return role === 'owner' || role === 'manager'
}

export async function updateOrderStatusAction(
  businessId: string,
  orderId: string,
  newStatus: 'pending' | 'completed' | 'paid' | 'cancelled',
  opts?: { reason?: string | null },
): Promise<ActionResult> {
  const actorRes = await requireTeamActor(businessId)
  if (!actorRes.success) return actorRes
  const actor = actorRes.data

  if (newStatus === 'cancelled') {
    const reasonText = (opts?.reason || '').trim()
    if (!reasonText) {
      return { success: false, error: 'A removal reason is required' }
    }
  }

  const db = createAdminClient()
  const { data: existing, error: fetchErr } = await db
    .from('orders')
    .select('id, status, business_id')
    .eq('id', orderId)
    .eq('business_id', businessId)
    .single()

  if (fetchErr || !existing) return { success: false, error: 'Order not found' }

  const patch: {
    status: typeof newStatus
    updated_at: string
    payment_status?: string
  } = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  }
  if (newStatus === 'paid') {
    patch.payment_status = 'paid'
  }

  const { error } = await db.from('orders').update(patch).eq('id', orderId)
  if (error) return { success: false, error: error.message }

  const prev = existing.status as string
  let action: string = newStatus
  if (newStatus === 'cancelled') action = 'cancelled'
  else if (newStatus === 'completed') action = 'completed'
  else if (newStatus === 'paid') action = 'paid'
  else if (newStatus === 'pending' && prev === 'cancelled') action = 'restored'

  const reason =
    newStatus === 'cancelled' ? (opts?.reason || '').trim() || null : null

  await recordOrderEvent({
    businessId,
    orderId,
    entityType: 'order',
    entityId: orderId,
    action,
    actorUserId: actor.userId,
    actorName: actor.name,
    actorRole: actor.role,
    reason,
    before: { status: prev },
    after: { status: newStatus, payment_status: newStatus === 'paid' ? 'paid' : undefined },
  })

  return { success: true, data: undefined }
}

export async function saveOrderEditAction(
  businessId: string,
  order: {
    id: string
    table_number: string | null
    total_amount: number
    order_items: Array<{ id: string; quantity: number; item_name?: string; unit_price?: number }>
  },
): Promise<ActionResult> {
  const actorRes = await requireTeamActor(businessId)
  if (!actorRes.success) return actorRes
  const actor = actorRes.data

  const db = createAdminClient()
  const { data: existing, error: fetchErr } = await db
    .from('orders')
    .select('id, table_number, total_amount, business_id')
    .eq('id', order.id)
    .eq('business_id', businessId)
    .single()

  if (fetchErr || !existing) return { success: false, error: 'Order not found' }

  const { error: orderError } = await db
    .from('orders')
    .update({
      table_number: order.table_number,
      total_amount: order.total_amount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id)

  if (orderError) return { success: false, error: orderError.message }

  const itemChanges: unknown[] = []
  for (const item of order.order_items) {
    if (item.quantity === 0) {
      await db.from('order_items').delete().eq('id', item.id)
      itemChanges.push({ id: item.id, action: 'removed', name: item.item_name })
      await recordOrderEvent({
        businessId,
        orderId: order.id,
        entityType: 'order_item',
        entityId: item.id,
        action: 'item_removed',
        actorUserId: actor.userId,
        actorName: actor.name,
        actorRole: actor.role,
        before: { item_name: item.item_name },
      })
    } else {
      await db.from('order_items').update({ quantity: item.quantity }).eq('id', item.id)
      itemChanges.push({ id: item.id, action: 'updated', quantity: item.quantity, name: item.item_name })
    }
  }

  await recordOrderEvent({
    businessId,
    orderId: order.id,
    entityType: 'order',
    entityId: order.id,
    action: 'edited',
    actorUserId: actor.userId,
    actorName: actor.name,
    actorRole: actor.role,
    before: {
      table_number: existing.table_number,
      total_amount: existing.total_amount,
    },
    after: {
      table_number: order.table_number,
      total_amount: order.total_amount,
      items: itemChanges,
    },
  })

  return { success: true, data: undefined }
}

export async function fetchOrderHistoryAction(
  businessId: string,
  opts: { from: string; to: string },
): Promise<ActionResult<{ orders: unknown[] }>> {
  const actorRes = await requireTeamActor(businessId)
  if (!actorRes.success) return actorRes
  if (!canViewHistory(actorRes.data.role)) {
    return { success: false, error: 'Only owners and managers can view history' }
  }

  const cutoff = getOrderRetentionCutoffIso()
  const from = new Date(opts.from) < new Date(cutoff) ? cutoff : opts.from
  const to = opts.to

  const db = createAdminClient()
  const { data, error } = await db
    .from('orders')
    .select('*, order_items(*)')
    .eq('business_id', businessId)
    .gte('created_at', from)
    .lte('created_at', to)
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) return { success: false, error: error.message }
  return { success: true, data: { orders: data ?? [] } }
}

export async function fetchOrderLogsAction(
  businessId: string,
  opts: { from: string; to: string },
): Promise<ActionResult<{ events: unknown[] }>> {
  const actorRes = await requireTeamActor(businessId)
  if (!actorRes.success) return actorRes
  if (!canViewHistory(actorRes.data.role)) {
    return { success: false, error: 'Only owners and managers can view history' }
  }

  const cutoff = getOrderRetentionCutoffIso()
  const from = new Date(opts.from) < new Date(cutoff) ? cutoff : opts.from

  const db = createAdminClient()
  const { data, error } = await db
    .from('order_events')
    .select('*')
    .eq('business_id', businessId)
    .gte('created_at', from)
    .lte('created_at', opts.to)
    .order('created_at', { ascending: false })
    .limit(1000)

  if (error) return { success: false, error: error.message }
  return { success: true, data: { events: data ?? [] } }
}

export async function exportOrderHistoryCsvAction(
  businessId: string,
  opts: { from: string; to: string; mode: 'orders' | 'logs' },
): Promise<ActionResult<{ csv: string; filename: string }>> {
  if (opts.mode === 'orders') {
    const res = await fetchOrderHistoryAction(businessId, opts)
    if (!res.success) return res
    const rows = res.data.orders as Array<Record<string, unknown>>
    const header = [
      'order_id',
      'created_at',
      'status',
      'payment_status',
      'table_number',
      'total_amount',
      'items',
    ]
    const lines = [header.join(',')]
    for (const o of rows) {
      const items = Array.isArray(o.order_items)
        ? (o.order_items as Array<{ quantity: number; item_name: string }>)
            .map((i) => `${i.quantity}x ${i.item_name}`)
            .join('; ')
        : ''
      lines.push(
        [
          o.id,
          o.created_at,
          o.status,
          o.payment_status,
          o.table_number ?? '',
          o.total_amount,
          `"${items.replace(/"/g, '""')}"`,
        ].join(','),
      )
    }
    return {
      success: true,
      data: {
        csv: lines.join('\n'),
        filename: `orders-${opts.from.slice(0, 10)}-${opts.to.slice(0, 10)}.csv`,
      },
    }
  }

  const res = await fetchOrderLogsAction(businessId, opts)
  if (!res.success) return res
  const rows = res.data.events as Array<Record<string, unknown>>
  const header = [
    'created_at',
    'action',
    'actor_name',
    'actor_role',
    'reason',
    'order_id',
    'entity_type',
  ]
  const lines = [header.join(',')]
  for (const e of rows) {
    lines.push(
      [
        e.created_at,
        e.action,
        `"${String(e.actor_name ?? '').replace(/"/g, '""')}"`,
        e.actor_role ?? '',
        `"${String(e.reason ?? '').replace(/"/g, '""')}"`,
        e.order_id ?? '',
        e.entity_type,
      ].join(','),
    )
  }
  return {
    success: true,
    data: {
      csv: lines.join('\n'),
      filename: `order-logs-${opts.from.slice(0, 10)}-${opts.to.slice(0, 10)}.csv`,
    },
  }
}

/** Cron / manual purge — not invokable from the browser (use /api/cron/purge-orders). */
export async function purgeExpiredOrdersAction(): Promise<ActionResult<{ deleted: number }>> {
  return { success: false, error: 'Forbidden' }
}
