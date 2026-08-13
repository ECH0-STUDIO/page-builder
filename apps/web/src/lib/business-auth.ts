import type { SupabaseClient } from '@supabase/supabase-js'

export type BusinessRole = 'owner' | 'manager' | 'staff'

const MANAGER_ROLES: BusinessRole[] = ['owner', 'manager']

/** Resolve the caller's role for a business (owner via businesses.owner_id, else business_members). */
export async function getUserBusinessRole(
  supabase: SupabaseClient,
  userId: string,
  businessId: string,
): Promise<BusinessRole | null> {
  const { data: business } = await supabase
    .from('businesses')
    .select('owner_id')
    .eq('id', businessId)
    .maybeSingle()

  if (!business) return null
  if (business.owner_id === userId) return 'owner'

  const { data: member } = await supabase
    .from('business_members')
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .maybeSingle()

  if (member?.role === 'owner' || member?.role === 'manager' || member?.role === 'staff') {
    return member.role
  }
  return null
}

export function isOwnerOrManager(role: BusinessRole | null | undefined): boolean {
  return role === 'owner' || role === 'manager'
}

/** Owner or manager may manage billing, media, page builder, and credits. */
export async function assertOwnerOrManager(
  supabase: SupabaseClient,
  userId: string,
  businessId: string,
): Promise<{ ok: true; role: BusinessRole } | { ok: false; error: string }> {
  const role = await getUserBusinessRole(supabase, userId, businessId)
  if (!role) return { ok: false, error: 'Business not found' }
  if (!MANAGER_ROLES.includes(role)) {
    return { ok: false, error: 'Only owners and managers can perform this action' }
  }
  return { ok: true, role }
}

/** First path segment must be the business UUID (e.g. `{businessId}/logo.jpg`). */
export function storagePathBelongsToBusiness(path: string, businessId: string): boolean {
  const segment = path.split('/')[0]
  return segment === businessId
}
