import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import type { Business } from '@/lib/business'

type ActiveBusinessResult = {
  business: Business | null
  role: string | null
}

/**
 * Resolve active business for a user (cookie → ownership → membership).
 * Cached per request by userId so layout + page don't double-query.
 * `supabase` is kept for call-site compatibility; lookups use the admin client.
 */
export async function getActiveBusiness(
  _supabase: SupabaseClient | null,
  userId: string,
): Promise<ActiveBusinessResult> {
  return getActiveBusinessCached(userId)
}

const getActiveBusinessCached = cache(async (userId: string): Promise<ActiveBusinessResult> => {
  const adminClient = createAdminClient()
  const cookieStore = await cookies()
  const currentId = cookieStore.get('eatery_current_business_id')?.value

  if (currentId) {
    const { data: ownedBusinesses } = await adminClient
      .from('businesses')
      .select('*')
      .eq('id', currentId)
      .eq('owner_id', userId)
      .limit(1)

    if (ownedBusinesses && ownedBusinesses.length > 0) {
      return { business: ownedBusinesses[0] as Business, role: 'owner' }
    }

    const { data: memberships } = await adminClient
      .from('business_members')
      .select('role, business_id, businesses:business_id (*)')
      .eq('business_id', currentId)
      .eq('user_id', userId)
      .limit(1)

    if (memberships && memberships.length > 0) {
      const member = memberships[0]
      const business = Array.isArray(member.businesses) ? member.businesses[0] : member.businesses
      if (business) {
        return { business: business as Business, role: member.role }
      }
    }
  }

  const { data: fallbackOwned } = await adminClient
    .from('businesses')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)

  if (fallbackOwned && fallbackOwned.length > 0) {
    return {
      business: fallbackOwned[0] as Business,
      role: 'owner',
    }
  }

  const { data: fallbackMemberships } = await adminClient
    .from('business_members')
    .select(`
      role,
      business_id,
      businesses:business_id (*)
    `)
    .eq('user_id', userId)
    .limit(1)

  if (fallbackMemberships && fallbackMemberships.length > 0) {
    const member = fallbackMemberships[0]
    const business = Array.isArray(member.businesses) ? member.businesses[0] : member.businesses
    if (business) {
      return {
        business: business as Business,
        role: member.role,
      }
    }
  }

  return { business: null, role: null }
})

export const getAllUserBusinessesServer = cache(async (userId: string): Promise<Business[]> => {
  const adminClient = createAdminClient()

  const { data: ownedBusinesses } = await adminClient
    .from('businesses')
    .select('*')
    .eq('owner_id', userId)

  const { data: memberRows } = await adminClient
    .from('business_members')
    .select('role, businesses(*)')
    .eq('user_id', userId)

  const memberBusinesses =
    (memberRows
      ?.map((row: { role: string; businesses: unknown }) => {
        const b = Array.isArray(row.businesses) ? row.businesses[0] : row.businesses
        if (b && typeof b === 'object') {
          return { ...(b as Business), role: row.role }
        }
        return null
      })
      .filter(Boolean) as Business[]) || []

  const ownedWithRole = (ownedBusinesses?.map((b) => ({ ...(b as Business), role: 'owner' })) || []) as Business[]
  const allBusinesses = [...ownedWithRole, ...memberBusinesses]
  const uniqueBusinesses = Array.from(
    new Map(allBusinesses.map((b) => [b.id, b])).values(),
  )

  uniqueBusinesses.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )

  return uniqueBusinesses
})
