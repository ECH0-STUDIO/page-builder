'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function inviteTeamMemberAction(payload: { email: string, role: string, businessId: string }) {
  const { email, role, businessId } = payload

  console.log('Action called with:', { email, role, businessId })

  if (!email || !role || !businessId) {
    return { error: `Missing required fields. email=${email}, role=${role}, businessId=${businessId}` }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Verify the current user is an owner of this business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('owner_id', user.id)
    .single()

  if (!business) {
    return { error: 'Only the business owner can invite members' }
  }

  // Use the admin client to send the invite
  const adminClient = createAdminClient()

  let newUserId: string | null = null

  // This sends the invite email and creates a user row in auth.users
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { role: 'staff' },
  })

  if (error) {
    // If user already exists, we can still add them to the team
    if (error.message.toLowerCase().includes('already been registered') || error.message.toLowerCase().includes('already registered')) {
      // Look up their user ID using our secure RPC
      const { data: existingUserId, error: rpcError } = await adminClient
        .rpc('get_user_id_by_email', { email_address: email })
      
      if (rpcError || !existingUserId) {
        return { error: 'User exists but could not retrieve their ID.' }
      }
      newUserId = existingUserId
    } else {
      return { error: error.message }
    }
  } else {
    newUserId = data.user.id
  }

  // Create the business_members relationship
  // Note: Using 'any' here temporarily because types/database.ts hasn't been regenerated yet to include business_members
  const { error: dbError } = await (adminClient
    .from('business_members') as any)
    .insert({
      business_id: businessId,
      user_id: newUserId,
      role: role,
    })

  if (dbError) {
    // If they were already a member, it might fail unique constraint
    if (dbError.code === '23505') {
      return { error: 'This user is already a member of this business' }
    }
    return { error: dbError.message }
  }

  revalidatePath('/dashboard/settings/team')
  return { success: true }
}

export async function removeTeamMemberAction(payload: { memberId: string, businessId: string }) {
  const { memberId, businessId } = payload

  if (!memberId || !businessId) {
    return { error: 'Missing required fields' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Verify the current user is an owner of this business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('owner_id', user.id)
    .single()

  if (!business) {
    return { error: 'Only the business owner can remove members' }
  }

  const { error } = await (supabase
    .from('business_members') as any)
    .delete()
    .eq('id', memberId)
    .eq('business_id', businessId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings/team')
  return { success: true }
}
