import { createAdminClient } from '@/lib/supabase/server'

export type OrderEventAction =
  | 'created'
  | 'completed'
  | 'paid'
  | 'cancelled'
  | 'restored'
  | 'edited'
  | 'item_updated'
  | 'item_removed'
  | 'request_accepted'
  | 'request_dismissed'

export interface OrderEventInput {
  businessId: string
  orderId?: string | null
  entityType: 'order' | 'order_item' | 'service_request'
  entityId?: string | null
  action: OrderEventAction | string
  actorUserId?: string | null
  actorName?: string | null
  actorRole?: string | null
  reason?: string | null
  before?: unknown
  after?: unknown
}

/** Insert audit row via service role — never throws to callers (logs only). */
export async function recordOrderEvent(input: OrderEventInput): Promise<void> {
  try {
    const db = createAdminClient()
    const { error } = await db.from('order_events').insert({
      business_id: input.businessId,
      order_id: input.orderId ?? null,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      action: input.action,
      actor_user_id: input.actorUserId ?? null,
      actor_name: input.actorName ?? null,
      actor_role: input.actorRole ?? null,
      reason: input.reason ?? null,
      before: input.before ?? null,
      after: input.after ?? null,
    })
    if (error) {
      console.error('[recordOrderEvent]', error.message)
    }
  } catch (err) {
    console.error('[recordOrderEvent]', err)
  }
}
