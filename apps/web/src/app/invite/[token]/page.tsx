import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AcceptInviteForm } from './AcceptInviteForm'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 1. Validate the token (requires admin client because RLS restricts to business owners)
  const { data: invite } = await adminClient.from('team_invitations')
    .select(`
      id,
      email,
      role,
      status,
      business_id,
      businesses ( name )
    `)
    .eq('token', token)
    .single()

  if (!invite) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
          <h2 className="text-xl font-bold text-gray-900">Invalid Invitation</h2>
          <p className="text-gray-500 mt-2">This invitation link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  if (invite.status === 'accepted') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
          <h2 className="text-xl font-bold text-gray-900">Already Accepted</h2>
          <p className="text-gray-500 mt-2">This invitation has already been accepted.</p>
        </div>
      </div>
    )
  }

  // 2. Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Redirect to login with a next parameter to come back here
    redirect(`/login?next=/invite/${token}`)
  }

  // 3. Ensure the logged-in user's email matches the invitation
  if (user.email !== invite.email) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
          <h2 className="text-xl font-bold text-gray-900">Email Mismatch</h2>
          <p className="text-gray-500 mt-2">
            This invitation was sent to <strong>{invite.email}</strong>, but you are logged in as <strong>{user.email}</strong>.
          </p>
          <p className="text-sm text-gray-400 mt-4">Please log out and log in with the correct email.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Join Team</h2>
          <p className="text-gray-500 mt-2">
            You've been invited to join <strong>{invite.businesses.name}</strong> as a {invite.role}.
          </p>
        </div>
        
        <AcceptInviteForm token={token} />
      </div>
    </div>
  )
}
