'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/business-server'
import { recordOrderEvent } from '@/lib/order-events'

export type ServiceRequestType = 'call_staff' | 'request_check'
export type ServiceRequestStatus = 'open' | 'acknowledged' | 'dismissed'

export type ServiceRequest = {
  id: string
  business_id: string
  table_number: string
  type: ServiceRequestType
  status: ServiceRequestStatus
  created_at: string
  updated_at: string
  acknowledged_at: string | null
}

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function createServiceRequestAction(
  businessId: string,
  tableNumber: string,
  type: ServiceRequestType,
): Promise<ActionResult<{ id: string }>> {
  const table = tableNumber.trim()
  if (!businessId) return { success: false, error: 'Business ID missing' }
  if (!table) return { success: false, error: 'Table number required' }
  if (type !== 'call_staff' && type !== 'request_check') {
    return { success: false, error: 'Invalid request type' }
  }

  const db = createAdminClient()
  const { data, error } = await db
    .from('service_requests')
    .insert({
      business_id: businessId,
      table_number: table,
      type,
      status: 'open',
    })
    .select('id')
    .single()

  if (error) {
    const msg = error.message || 'Failed to create request'
    if (/schema cache|does not exist|Could not find the table/i.test(msg)) {
      return {
        success: false,
        error:
          'Service requests table is missing or not exposed. Run migration 042_service_requests_repair.sql in Supabase, then wait a few seconds for the API cache to reload.',
      }
    }
    return { success: false, error: msg }
  }
  return { success: true, data: { id: data.id } }
}

export async function updateServiceRequestStatusAction(
  requestId: string,
  status: Exclude<ServiceRequestStatus, 'open'>,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { business, role } = await getActiveBusiness(supabase, user.id)
  if (!business || !role) return { success: false, error: 'No business access' }

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('service_requests')
    .select('id, business_id, type, status, table_number')
    .eq('id', requestId)
    .eq('business_id', business.id)
    .maybeSingle()

  if (!existing) return { success: false, error: 'Request not found' }

  const patch = {
    status,
    ...(status === 'acknowledged'
      ? { acknowledged_at: new Date().toISOString() }
      : {}),
  }

  const { error } = await admin
    .from('service_requests')
    .update(patch)
    .eq('id', requestId)

  if (error) return { success: false, error: error.message }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  await recordOrderEvent({
    businessId: business.id,
    orderId: null,
    entityType: 'service_request',
    entityId: requestId,
    action: status === 'acknowledged' ? 'request_accepted' : 'request_dismissed',
    actorUserId: user.id,
    actorName: profile?.full_name || user.email || 'Team member',
    actorRole: role,
    before: { status: existing.status, type: existing.type, table_number: existing.table_number },
    after: { status },
  })

  return { success: true, data: undefined }
}
