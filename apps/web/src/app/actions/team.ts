'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function inviteTeamMemberAction(formData: FormData) {
  const email = formData.get('email') as string
  const role = formData.get('role') as string
  const businessId = formData.get('businessId') as string

  if (!email || !role || !businessId) {
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
    return { error: 'Only the business owner can invite members' }
  }

  // Use the admin client to send the invite
  const adminClient = createAdminClient()

  // This sends the invite email and creates a user row in auth.users
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: {
      role: 'staff',
    },
    // We can also pass redirectTo here if needed, but it should default to the site url
  })

  if (error) {
    return { error: error.message }
  }

  const newUserId = data.user.id

  // Create the business_members relationship
  const { error: dbError } = await adminClient
    .from('business_members')
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

export async function removeTeamMemberAction(formData: FormData) {
  const memberId = formData.get('memberId') as string
  const businessId = formData.get('businessId') as string

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

  const { error } = await supabase
    .from('business_members')
    .delete()
    .eq('id', memberId)
    .eq('business_id', businessId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings/team')
  return { success: true }
}
