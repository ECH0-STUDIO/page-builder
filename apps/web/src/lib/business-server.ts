import { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { ACTIVE_BUSINESS_STORAGE_KEY } from '@/lib/active-business'

export async function getActiveBusiness(supabase: SupabaseClient, userId: string) {
  const adminClient = createAdminClient()
  const cookieStore = await cookies()
  const currentId = cookieStore.get(ACTIVE_BUSINESS_STORAGE_KEY)?.value

  if (currentId) {
    // 1. Check if user is owner of this specific business
    const { data: ownedBusinesses } = await adminClient
      .from('businesses')
      .select('*')
      .eq('id', currentId)
      .eq('owner_id', userId)
      .limit(1)

    if (ownedBusinesses && ownedBusinesses.length > 0) {
      return { business: ownedBusinesses[0], role: 'owner' }
    }

    // 2. Check if user is member of this specific business
    const { data: memberships } = await adminClient.from('business_members')
      .select('role, business_id, businesses:business_id (*)')
      .eq('business_id', currentId)
      .eq('user_id', userId)
      .limit(1)

    if (memberships && memberships.length > 0) {
      const member = memberships[0]
      const business = Array.isArray(member.businesses) ? member.businesses[0] : member.businesses
      if (business) {
        return { business, role: member.role }
      }
    }
  }

  // Fallback: If no cookie or cookie ID is invalid, just pick the first available business
  
  // 1. Try to find a business where the user is the owner
  const { data: fallbackOwned } = await adminClient
    .from('businesses')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)

  if (fallbackOwned && fallbackOwned.length > 0) {
    return {
      business: fallbackOwned[0],
      role: 'owner',
    }
  }

  // 2. If not an owner, check if they are a team member
  const { data: fallbackMemberships } = await adminClient.from('business_members')
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
        business: business,
        role: member.role,
      }
    }
  }

  return { business: null, role: null }
}

export async function getAllUserBusinessesServer(userId: string) {
  const adminClient = createAdminClient()

  // Fetch businesses where user is owner
  const { data: ownedBusinesses } = await adminClient
    .from('businesses')
    .select('*')
    .eq('owner_id', userId)

  // Fetch businesses where user is a member
  const { data: memberRows } = await adminClient.from('business_members')
    .select('role, businesses(*)')
    .eq('user_id', userId)

  const memberBusinesses = memberRows
    ?.map((row: any) => {
      const b = Array.isArray(row.businesses) ? row.businesses[0] : row.businesses
      if (b) {
        return { ...b, role: row.role }
      }
      return null
    })
    .filter(Boolean) || []

  // Combine and deduplicate
  const ownedWithRole = ownedBusinesses?.map((b: any) => ({ ...b, role: 'owner' })) || []
  const allBusinesses = [...ownedWithRole, ...memberBusinesses]
  const uniqueBusinesses = Array.from(new Map(allBusinesses.map((b: any) => [b.id, b])).values())

  // Sort by created_at ascending
  uniqueBusinesses.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return uniqueBusinesses
}
