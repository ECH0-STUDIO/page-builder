import { createAdminClient } from '@/lib/supabase/server'

type PushPayload = {
  title: string
  body: string
  url?: string
}

export type PushSendResult = {
  configured: boolean
  sent: number
  failed: number
  lastError?: string
}

function normalizeVapidKey(key: string): string {
  return key.trim().replace(/^["']|["']$/g, '').replace(/\s+/g, '')
}

export function isPushConfigured(): boolean {
  return Boolean(
    normalizeVapidKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '')
    && normalizeVapidKey(process.env.VAPID_PRIVATE_KEY || ''),
  )
}

async function sendPushRows(
  rows: Array<{ id: string; endpoint: string; p256dh: string; auth: string }>,
  payload: PushPayload,
): Promise<PushSendResult> {
  const publicKey = normalizeVapidKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '')
  const privateKey = normalizeVapidKey(process.env.VAPID_PRIVATE_KEY || '')
  const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:support@eateryvn.com'

  if (!publicKey || !privateKey) {
    return { configured: false, sent: 0, failed: 0 }
  }

  if (!rows.length) {
    return { configured: true, sent: 0, failed: 0 }
  }

  const webpush = await import('web-push')
  webpush.setVapidDetails(subject, publicKey, privateKey)

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/dashboard/orders',
  })

  const db = createAdminClient()
  let sent = 0
  let failed = 0
  let lastError: string | undefined

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
        sent += 1
      } catch (err: unknown) {
        failed += 1
        const statusCode =
          err && typeof err === 'object' && 'statusCode' in err
            ? Number((err as { statusCode: number }).statusCode)
            : 0
        const message =
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: string }).message)
            : 'Push delivery failed'
        lastError = statusCode ? `${statusCode}: ${message}` : message
        console.error('[push-notify]', lastError, row.endpoint.slice(0, 48))
        if (statusCode === 404 || statusCode === 410) {
          await db.from('push_subscriptions').delete().eq('id', row.id)
        }
      }
    }),
  )

  return { configured: true, sent, failed, lastError }
}

/**
 * Fan-out Web Push to all subscriptions for a business.
 * No-ops when VAPID keys are missing. Never throws to callers.
 */
export async function notifyBusinessPush(
  businessId: string,
  payload: PushPayload,
): Promise<void> {
  if (!isPushConfigured()) return

  try {
    const db = createAdminClient()
    const { data: rows } = await db
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('business_id', businessId)

    await sendPushRows(rows ?? [], payload)
  } catch (err) {
    console.error('[notifyBusinessPush]', err)
  }
}

/** Send to one staff member's subscriptions for a business (e.g. test on enable). */
export async function notifyUserPush(
  userId: string,
  businessId: string,
  payload: PushPayload,
): Promise<PushSendResult> {
  if (!isPushConfigured()) {
    return { configured: false, sent: 0, failed: 0 }
  }

  const db = createAdminClient()
  const { data: rows } = await db
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('business_id', businessId)
    .eq('user_id', userId)

  return sendPushRows(rows ?? [], payload)
}
