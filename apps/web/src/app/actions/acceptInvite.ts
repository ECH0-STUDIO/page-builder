'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function acceptInviteAction(token: string) {
  if (!token) return { error: 'Invalid token' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to accept an invitation.' }
  }

  // Admin client needed to verify and update the invitation if RLS restricts it
  const adminClient = createAdminClient()

  // 1. Fetch the invitation
  const { data: invite } = await (adminClient.from('team_invitations') as any)
    .select('*')
    .eq('token', token)
    .single()

  if (!invite) return { error: 'Invitation not found or expired.' }
  if (invite.status === 'accepted') return { error: 'Invitation already accepted.' }
  if (invite.email !== user.email) return { error: 'This invitation belongs to a different email address.' }

  // 2. Add user to business_members
  const { error: insertError } = await (adminClient.from('business_members') as any)
    .insert({
      business_id: invite.business_id,
      user_id: user.id,
      role: invite.role
    })

  if (insertError) {
    if (insertError.code === '23505') {
      // Already a member, just mark as accepted
    } else {
      return { error: 'Failed to join the business: ' + insertError.message }
    }
  }

  // 3. Mark invite as accepted
  await (adminClient.from('team_invitations') as any)
    .update({ status: 'accepted' })
    .eq('id', invite.id)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings/team')
  return { success: true }
}
