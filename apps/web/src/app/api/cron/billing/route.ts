import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { billCustomDomainForBusiness, billLocalesForBusiness } from '@/lib/billing-internal'

/** Vercel's function ceiling; the loop stops early rather than being killed mid-charge. */
const MAX_RUN_MS = 50_000

function authorizeCron(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET
  // Fail closed: without a secret this endpoint could be used to trigger charges.
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 401 })
  }

  const auth = req.headers.get('authorization') || ''
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

/**
 * Charge due custom domains and store locales.
 *
 * Both were previously billed only as a side effect of rendering a dashboard
 * page, so a business whose owner stopped visiting kept its paid features for
 * free. Each core is idempotent — it re-reads the due date and returns without
 * charging when the cycle has not elapsed — so overlapping or repeated runs are
 * safe, and this endpoint does not replace the opportunistic calls.
 */
export async function POST(req: Request) {
  const denied = authorizeCron(req)
  if (denied) return denied

  const db = createAdminClient()
  const startedAt = Date.now()
  const nowIso = new Date().toISOString()

  const summary = {
    domainsBilled: 0,
    domainsSuspended: 0,
    localesBilled: 0,
    localesSuspended: 0,
    errors: [] as string[],
    truncated: false,
  }

  // ── Custom domains ──
  const { data: dueDomains, error: domainError } = await (db as any)
    .from('publishing_settings')
    .select('business_id')
    .not('custom_domain', 'is', null)
    .eq('custom_domain_verified', true)
    .or(`custom_domain_billed_until.is.null,custom_domain_billed_until.lte.${nowIso}`)

  if (domainError) {
    summary.errors.push(`domains query: ${domainError.message}`)
  }

  for (const row of (dueDomains ?? []) as { business_id: string }[]) {
    if (Date.now() - startedAt > MAX_RUN_MS) {
      summary.truncated = true
      break
    }
    try {
      const result = await billCustomDomainForBusiness(row.business_id)
      if (result.billed) summary.domainsBilled += 1
      if (result.suspended) summary.domainsSuspended += 1
    } catch (error) {
      // One bad tenant must not stop the rest of the run.
      summary.errors.push(`domain ${row.business_id}: ${error instanceof Error ? error.message : 'failed'}`)
    }
  }

  // ── Store locales ──
  const { data: dueLocales, error: localeError } = await (db as any)
    .from('business_locales')
    .select('business_id')
    .eq('status', 'active')
    .lte('next_bill_at', nowIso)

  if (localeError) {
    summary.errors.push(`locales query: ${localeError.message}`)
  }

  const localeBusinessIds = [
    ...new Set(((dueLocales ?? []) as { business_id: string }[]).map(r => r.business_id)),
  ]

  for (const businessId of localeBusinessIds) {
    if (Date.now() - startedAt > MAX_RUN_MS) {
      summary.truncated = true
      break
    }
    try {
      const result = await billLocalesForBusiness(businessId)
      summary.localesBilled += result.billed ?? 0
      summary.localesSuspended += (result.suspended ?? []).length
    } catch (error) {
      summary.errors.push(`locales ${businessId}: ${error instanceof Error ? error.message : 'failed'}`)
    }
  }

  return NextResponse.json({ ok: true, ...summary, elapsedMs: Date.now() - startedAt })
}

export async function GET(req: Request) {
  return POST(req)
}
