import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

function authorizeCron(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET
  const isProduction = process.env.NODE_ENV === 'production'

  if (!secret) {
    if (isProduction) {
      return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 401 })
    }
    return null
  }

  const auth = req.headers.get('authorization') || ''
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

/**
 * Hard-delete orders / events / service requests outside the retention window.
 * Protect with CRON_SECRET (Authorization: Bearer …) when calling from Vercel Cron.
 */
export async function POST(req: Request) {
  const denied = authorizeCron(req)
  if (denied) return denied

  const db = createAdminClient()
  const { data, error } = await db.rpc('purge_orders_outside_retention')
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ deleted: Number(data) || 0 })
}

export async function GET(req: Request) {
  return POST(req)
}
