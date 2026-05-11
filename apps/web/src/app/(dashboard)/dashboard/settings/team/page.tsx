import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { TeamList } from './TeamList'

export const metadata: Metadata = { title: 'Team Management' }

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get current business
  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  const business = businesses?.[0] as any

  if (!business) {
    return <div>No business found. Please create one first.</div>
  }

  // Fetch team members for this business
  const { data: members } = await (supabase
    .from('business_members') as any)
    .select(`
      id,
      role,
      user_id
    `)
    .eq('business_id', business.id)

  // Fetch emails for these user_ids. Since auth.users is protected, we must use an admin client or a join.
  // Wait, we can't join auth.users directly via standard Supabase client in most setups unless a view is exposed.
  // Instead of creating a view right now, we can fetch profiles.
  const userIds = members?.map((m: any) => m.user_id) || []
  let userProfiles: any[] = []
  
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds)
    userProfiles = profiles || []
  }

  const enrichedMembers = members?.map((m: any) => {
    const p = userProfiles.find(profile => profile.id === m.user_id)
    return {
      ...m,
      name: p?.full_name || 'Pending / No Name',
    }
  }) || []

  // Add the owner to the top of the list
  const { data: ownerProfileData } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const ownerProfile = ownerProfileData as any
  const fullTeam = [
    {
      id: 'owner-row',
      role: 'owner',
      user_id: user.id,
      name: ownerProfile?.full_name || 'You (Owner)'
    },
    ...enrichedMembers
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Team Management</h3>
        <p className="text-sm text-muted-foreground">
          Invite staff and manage their access levels.
        </p>
      </div>
      
      <TeamList members={fullTeam} businessId={business.id} />
    </div>
  )
}
