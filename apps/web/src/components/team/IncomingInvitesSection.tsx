import { getAuthUser } from '@/lib/auth-server'
import { listIncomingInvites } from '@/lib/pending-invitations'
import { IncomingInvites } from './IncomingInvites'

export async function IncomingInvitesSection() {
  const { user } = await getAuthUser()
  if (!user?.email) return null
  const invites = await listIncomingInvites(user.email)
  if (invites.length === 0) return null
  return <IncomingInvites invites={invites} />
}
