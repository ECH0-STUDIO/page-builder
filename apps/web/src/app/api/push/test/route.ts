import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/business-server'
import { notifyUserPush } from '@/lib/push-notify'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { businessId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const businessId = body.businessId
  if (!businessId) {
    return NextResponse.json({ error: 'businessId required' }, { status: 400 })
  }

  const { business, role } = await getActiveBusiness(supabase, user.id)
  if (!business || business.id !== businessId || !role) {
    return NextResponse.json({ error: 'No access to this business' }, { status: 403 })
  }

  const result = await notifyUserPush(user.id, businessId, {
    title: 'Live Orders',
    body: 'Notifications are working. You will be alerted for new orders and table requests.',
    url: '/dashboard/orders',
  })

  if (!result.configured) {
    return NextResponse.json(
      { error: 'Push is not configured on the server (VAPID keys missing)' },
      { status: 503 },
    )
  }

  if (result.sent === 0) {
    const detail = result.lastError
      ? `Push rejected: ${result.lastError}. Check that VAPID public and private keys are a matching pair.`
      : 'Subscription saved but no push could be delivered. Try turning notifications off and on again.'
    return NextResponse.json({ error: detail }, { status: 502 })
  }

  return NextResponse.json({ success: true, sent: result.sent, failed: result.failed })
}
