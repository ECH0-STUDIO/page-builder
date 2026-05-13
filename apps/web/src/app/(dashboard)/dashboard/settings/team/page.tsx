import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/business-server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { TeamList } from './TeamList'
import { getServerTranslation } from '@/i18n/getDictionary'

export const metadata: Metadata = { title: 'Team Management' }

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { t } = await getServerTranslation()

  // Get current business
  const { business } = await getActiveBusiness(supabase, user.id)

  if (!business) {
    return <div>{t('settings.team.noBusiness')}</div>
  }

  // Fetch team members for this business
  const adminClient = createAdminClient()
  const { data: members } = await (adminClient
    .from('business_members') as any)
    .select(`
      id,
      role,
      user_id
    `)
    .eq('business_id', business.id)

  // Fetch emails for these user_ids using Admin client
  const userIds = members?.map((m: any) => m.user_id) || []
  let userProfiles: any[] = []
  let userAuthData: Record<string, any> = {}
  
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds)
    userProfiles = profiles || []

    // Fetch auth emails
    for (const uid of userIds) {
      const { data } = await adminClient.auth.admin.getUserById(uid)
      if (data?.user) {
        userAuthData[uid] = data.user
      }
    }
  }

  const enrichedMembers = members?.map((m: any) => {
    const p = userProfiles.find(profile => profile.id === m.user_id)
    const authEmail = userAuthData[m.user_id]?.email
    
    // Fallback: If they have no name, just use the email
    const fallbackName = authEmail ? authEmail : 'No Name'
    
    return {
      ...m,
      name: p?.full_name || fallbackName,
    }
  }) || []

  // Fetch pending invitations
  const { data: pendingInvites } = await (adminClient
    .from('team_invitations') as any)
    .select('*')
    .eq('business_id', business.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Add the actual business owner to the top of the list
  const { data: ownerProfileData } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', business.owner_id)
    .single()

  // Also try to get the owner's email from auth if they have no name
  let ownerEmail = null
  const { data: ownerAuth } = await adminClient.auth.admin.getUserById(business.owner_id)
  if (ownerAuth?.user) {
    ownerEmail = ownerAuth.user.email
  }

  const ownerProfile = ownerProfileData as any
  const isCurrentUserOwner = business.owner_id === user.id
  
  const ownerName = ownerProfile?.full_name || ownerEmail || 'No Name'
  
  const fullTeam = [
    {
      id: 'owner-row',
      role: 'owner',
      user_id: business.owner_id,
      // Pass a flag so TeamList can translate with the right key
      name: isCurrentUserOwner ? `__YOU_OWNER__:${ownerName}` : ownerName
    },
    ...enrichedMembers
      .filter((m: any) => m.user_id !== business.owner_id)
      .map((m: any) => ({
        ...m,
        name: m.user_id === user.id ? `__YOU__:${m.name}` : m.name
      }))
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('settings.team.title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('settings.team.description')}
        </p>
      </div>
      
      <TeamList members={fullTeam} pendingInvites={pendingInvites || []} businessId={business.id} />
    </div>
  )
}
