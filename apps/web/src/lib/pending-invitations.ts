import { createAdminClient } from '@/lib/supabase/server'

export type IncomingInvite = {
  id: string
  token: string
  role: string
  businessId: string
  businessName: string
}

export async function listIncomingInvites(email: string | null | undefined): Promise<IncomingInvite[]> {
  const normalized = email?.trim().toLowerCase()
  if (!normalized) return []

  const admin = createAdminClient()
  const { data } = await admin
    .from('team_invitations')
    .select('id, token, role, email, status, expires_at, business_id, businesses ( name )')
    .eq('status', 'pending')
    .ilike('email', normalized)
    .gt('expires_at', new Date().toISOString())

  return (data ?? []).map((row) => {
    const business = row.businesses as { name?: string } | { name?: string }[] | null
    const name = Array.isArray(business) ? business[0]?.name : business?.name
    return {
      id: row.id,
      token: row.token,
      role: row.role,
      businessId: row.business_id,
      businessName: name || 'Eatery',
    }
  })
}
