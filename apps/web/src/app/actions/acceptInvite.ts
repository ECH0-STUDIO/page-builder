'use server'

import { cookies } from 'next/headers'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function sameEmail(a?: string | null, b?: string | null) {
  return (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase()
}

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
  const { data: invite } = await adminClient.from('team_invitations')
    .select('*')
    .eq('token', token)
    .single()

  if (!invite) return { error: 'Invitation not found or expired.' }
  if (invite.status === 'accepted') return { error: 'Invitation already accepted.' }
  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return { error: 'Invitation not found or expired.' }
  }
  if (!sameEmail(invite.email, user.email)) return { error: 'This invitation belongs to a different email address.' }

  // 2. Add user to business_members
  const { error: insertError } = await adminClient.from('business_members')
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
  await adminClient.from('team_invitations')
    .update({ status: 'accepted' })
    .eq('id', invite.id)

  const jar = await cookies()
  jar.set('eatery_current_business_id', invite.business_id, { path: '/', maxAge: 60 * 60 * 24 * 365 })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings/team')
  return { success: true }
}

export async function declineInviteAction(token: string) {
  if (!token) return { error: 'Invalid token' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in to decline an invitation.' }

  const adminClient = createAdminClient()
  const { data: invite } = await adminClient.from('team_invitations')
    .select('id, email, status')
    .eq('token', token)
    .single()

  if (!invite || invite.status !== 'pending') return { error: 'Invitation not found or expired.' }
  if (!sameEmail(invite.email, user.email)) return { error: 'This invitation belongs to a different email address.' }

  const { error } = await adminClient.from('team_invitations').delete().eq('id', invite.id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings/team')
  revalidatePath('/onboarding/new-business')
  return { success: true }
}
