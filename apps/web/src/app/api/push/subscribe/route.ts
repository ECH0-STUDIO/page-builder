import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/business-server'

type PushSubscriptionPayload = {
  endpoint?: string
  keys?: {
    p256dh?: string
    auth?: string
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { businessId?: string; subscription?: PushSubscriptionPayload }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const businessId = body.businessId
  const subscription = body.subscription
  const endpoint = subscription?.endpoint
  const p256dh = subscription?.keys?.p256dh
  const auth = subscription?.keys?.auth

  if (!businessId || !endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: 'Invalid subscription payload' }, { status: 400 })
  }

  const { business, role } = await getActiveBusiness(supabase, user.id)
  if (!business || business.id !== businessId || !role) {
    return NextResponse.json({ error: 'No access to this business' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      business_id: businessId,
      endpoint,
      p256dh,
      auth,
    },
    { onConflict: 'user_id,business_id,endpoint' },
  )

  if (error) {
    console.error('[push/subscribe]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
