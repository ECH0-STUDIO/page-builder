import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createAdminClient()

  // Fetch businesses where user is owner
  const { data: ownedBusinesses } = await adminClient
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)

  // Fetch businesses where user is a member
  const { data: memberRows } = await adminClient.from('business_members')
    .select('businesses(*)')
    .eq('user_id', user.id)

  const memberBusinesses = memberRows
    ?.map((row: any) => (Array.isArray(row.businesses) ? row.businesses[0] : row.businesses))
    .filter(Boolean) || []

  // Combine and deduplicate
  const allBusinesses = [...(ownedBusinesses || []), ...memberBusinesses]
  const uniqueBusinesses = Array.from(new Map(allBusinesses.map((b: any) => [b.id, b])).values())

  // Sort by created_at ascending
  uniqueBusinesses.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return NextResponse.json({ businesses: uniqueBusinesses })
}
