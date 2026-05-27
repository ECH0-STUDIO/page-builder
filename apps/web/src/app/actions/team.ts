'use server'

import { createClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/business-server'
import { revalidatePath } from 'next/cache'
import { sendTeamInvite } from '@/lib/email'

export async function inviteTeamMemberAction(payload: { email: string, role: string, businessId: string }) {
  const { email, role, businessId } = payload

  if (!email || !role || !businessId) {
    return { error: `Missing required fields` }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Verify the current user is an owner or manager of this business
  const { business, role: userRole } = await getActiveBusiness(supabase, user.id)
  
  if (!business || business.id !== businessId) {
    return { error: 'Invalid business context' }
  }

  if (userRole !== 'owner' && userRole !== 'manager') {
    return { error: 'Only business owners and managers can invite members' }
  }

  // Find any existing pending invites for this user
  const { data: existingInvites } = await supabase.from('team_invitations')
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
    await supabase.from('team_invitations')
      .delete()
      .eq('business_id', businessId)
      .eq('email', email)
      .eq('status', 'pending')
  }

  // Insert a new pending invitation
  const { data: inviteRow, error: inviteError } = await supabase.from('team_invitations')
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
    await supabase.from('team_invitations').delete().eq('id', inviteRow.id)
    return { error: 'Failed to send invitation email — please try again.' }
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

  // Verify the current user is an owner or manager of this business
  const { business, role: userRole } = await getActiveBusiness(supabase, user.id)

  if (!business || business.id !== businessId) {
    return { error: 'Invalid business context' }
  }

  if (userRole !== 'owner' && userRole !== 'manager') {
    return { error: 'Only business owners and managers can remove members' }
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

export async function updateTeamMemberRoleAction(payload: { memberId: string, businessId: string, newRole: string }) {
  const { memberId, businessId, newRole } = payload

  if (!memberId || !businessId || !newRole) {
    return { error: 'Missing required fields' }
  }

  if (newRole !== 'staff' && newRole !== 'manager') {
    return { error: 'Invalid role' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { business, role: userRole } = await getActiveBusiness(supabase, user.id)

  if (!business || business.id !== businessId) {
    return { error: 'Invalid business context' }
  }

  if (userRole !== 'owner' && userRole !== 'manager') {
    return { error: 'Only business owners and managers can change roles' }
  }

  // Prevent managers from modifying other managers or owners
  const { data: targetMember } = await supabase
    .from('business_members')
    .select('role')
    .eq('id', memberId)
    .eq('business_id', businessId)
    .single()

  if (!targetMember) {
    return { error: 'Member not found' }
  }

  if (targetMember.role === 'owner') {
    return { error: 'Cannot change the role of the owner' }
  }

  if (userRole === 'manager' && targetMember.role === 'manager') {
    return { error: 'Managers cannot modify other managers' }
  }

  const { error } = await supabase
    .from('business_members')
    .update({ role: newRole })
    .eq('id', memberId)
    .eq('business_id', businessId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings/team')
  return { success: true }
}

export async function updateTeamMemberRolesAction(payload: { updates: { memberId: string, newRole: string }[], businessId: string }) {
  const { updates, businessId } = payload

  if (!updates || !Array.isArray(updates) || !businessId) {
    return { error: 'Invalid payload' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { business, role: userRole } = await getActiveBusiness(supabase, user.id)

  if (!business || business.id !== businessId) {
    return { error: 'Invalid business context' }
  }

  if (userRole !== 'owner' && userRole !== 'manager') {
    return { error: 'Only business owners and managers can change roles' }
  }

  // Iterate and apply updates
  let hasErrors = false
  for (const update of updates) {
    if (update.newRole !== 'staff' && update.newRole !== 'manager') continue

    const { data: targetMember } = await supabase
      .from('business_members')
      .select('role')
      .eq('id', update.memberId)
      .eq('business_id', businessId)
      .single()

    if (!targetMember) continue
    if (targetMember.role === 'owner') continue
    if (userRole === 'manager' && targetMember.role === 'manager') continue

    const { error } = await supabase
      .from('business_members')
      .update({ role: update.newRole })
      .eq('id', update.memberId)
      .eq('business_id', businessId)
      
    if (error) hasErrors = true
  }

  revalidatePath('/dashboard/settings/team')
  return { success: true, hasErrors }
}
