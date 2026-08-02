import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PAGE_VIEWS_PER_CREDIT } from '@/lib/credit-packs'

/**
 * POST /api/view/[slug]
 *
 * Increments the daily page_views counter and bills 1 credit / 500 views.
 * Uses service-role key to bypass RLS (no auth needed from client).
 * Called silently on every public live-page visit.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Service-role client — bypasses RLS for the upsert
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Resolve slug → business_id
  const { data: biz, error: bizErr } = await supabase
    .from('businesses')
    .select('id')
    .eq('slug', slug)
    .single()

  if (bizErr || !biz) {
    return NextResponse.json({ ok: false }, { status: 404 })
  }

  const today = new Date().toISOString().slice(0, 10)

  // Atomic increment + bill when a new 500-view block is crossed
  const { error } = await supabase.rpc('increment_page_view_and_bill', {
    p_business_id: biz.id,
    p_date: today,
    p_views_per_credit: PAGE_VIEWS_PER_CREDIT,
  })

  if (error) {
    // Fallback: count the view even if billing RPC is unavailable (pre-migration)
    console.error('increment_page_view_and_bill error:', error.message)
    const { error: legacyErr } = await supabase.rpc('increment_page_view', {
      p_business_id: biz.id,
      p_date: today,
    })
    if (legacyErr) {
      await supabase
        .from('page_views')
        .upsert(
          { business_id: biz.id, viewed_at: today, count: 1 },
          { onConflict: 'business_id,viewed_at', ignoreDuplicates: false },
        )
    }
  }

  return NextResponse.json({ ok: true })
}
