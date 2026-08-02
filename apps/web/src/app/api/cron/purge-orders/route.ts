import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Hard-delete orders / events / service requests outside the retention window.
 * Protect with CRON_SECRET (Authorization: Bearer …) when calling from Vercel Cron.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization') || ''
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

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
