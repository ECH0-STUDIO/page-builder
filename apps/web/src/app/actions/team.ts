'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendTeamInvite } from '@/lib/email'

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
  const { data: businessData } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('id', businessId)
    .eq('owner_id', user.id)
    .single()

  const business = businessData as any

  if (!business) {
    return { error: 'Only the business owner can invite members' }
  }

  // Find any existing pending invites for this user
  const { data: existingInvites } = await (supabase.from('team_invitations') as any)
    .select('id, created_at')
    .eq('business_id', businessId)
    .eq('email', email)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    
  if (existingInvites && existingInvites.length > 0) {
    const mostRecent = existingInvites[0]
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
    const createdAt = new Date(mostRecent.created_at)
    
    if (createdAt > oneMinuteAgo) {
      return { error: 'Please wait at least 1 minute before resending an invite to this email.' }
    }
    
    // Delete old pending invites to avoid duplicates
    await (supabase.from('team_invitations') as any)
      .delete()
      .eq('business_id', businessId)
      .eq('email', email)
      .eq('status', 'pending')
  }

  // Insert a new pending invitation
  const { data: inviteRow, error: inviteError } = await (supabase.from('team_invitations') as any)
    .insert({
      business_id: businessId,
      email: email,
      role: role,
      status: 'pending'
    })
    .select('id, token')
    .single()

  if (inviteError || !inviteRow) {
    return { error: inviteError?.message || 'Failed to create invitation' }
  }

  // Generate the acceptance link
  // Use headers to get the host if possible, or fallback
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const inviteLink = `${appUrl}/invite/${inviteRow.token}`

  // Send the email via Resend
  const emailRes = await sendTeamInvite({
    toEmail: email,
    businessName: business.name,
    invitedByEmail: user.email || 'The Owner',
    role: role,
    inviteLink: inviteLink
  })

  if (emailRes.error) {
    // Delete the pending invite so the user isn't stuck with a 1-minute timeout for a broken invite
    await (supabase.from('team_invitations') as any).delete().eq('id', inviteRow.id || inviteRow.token)
    
    // Attempt deletion using token if ID isn't returned for some reason, though single() usually returns what was selected.
    // Wait, the select('token') only returns { token }. We need ID.
    return { error: 'Invitation created but failed to send email: ' + emailRes.error }
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
