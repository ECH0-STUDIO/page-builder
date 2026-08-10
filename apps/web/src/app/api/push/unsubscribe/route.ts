import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/business-server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { businessId?: string; endpoint?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { businessId, endpoint } = body
  if (!businessId || !endpoint) {
    return NextResponse.json({ error: 'businessId and endpoint required' }, { status: 400 })
  }

  const { business, role } = await getActiveBusiness(supabase, user.id)
  if (!business || business.id !== businessId || !role) {
    return NextResponse.json({ error: 'No access to this business' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('business_id', businessId)
    .eq('endpoint', endpoint)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
