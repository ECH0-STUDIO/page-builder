import { createAdminClient } from '@/lib/supabase/server'

type PushPayload = {
  title: string
  body: string
  url?: string
}

/**
 * Fan-out Web Push to all subscriptions for a business.
 * No-ops when VAPID keys are missing. Never throws to callers.
 */
export async function notifyBusinessPush(
  businessId: string,
  payload: PushPayload,
): Promise<void> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:support@eateryvn.com'
  if (!publicKey || !privateKey) return

  try {
    const webpush = await import('web-push')
    webpush.setVapidDetails(subject, publicKey, privateKey)

    const db = createAdminClient()
    const { data: rows } = await db
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('business_id', businessId)

    if (!rows?.length) return

    const body = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/dashboard/orders',
    })

    await Promise.allSettled(
      rows.map(async (row) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: row.endpoint,
              keys: { p256dh: row.p256dh, auth: row.auth },
            },
            body,
          )
        } catch (err: unknown) {
          const statusCode =
            err && typeof err === 'object' && 'statusCode' in err
              ? Number((err as { statusCode: number }).statusCode)
              : 0
          // Gone / expired subscription
          if (statusCode === 404 || statusCode === 410) {
            await db.from('push_subscriptions').delete().eq('id', row.id)
          }
        }
      }),
    )
  } catch (err) {
    console.error('[notifyBusinessPush]', err)
  }
}
