import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/view/[slug]
 *
 * Increments the daily page_views counter for the given slug.
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

  // Upsert: if a row for today exists, increment count; otherwise insert with count=1
  // Supabase doesn't support atomic increment via upsert directly, so we use rpc or
  // a two-step approach. Using rpc is cleanest:
  const { error } = await supabase.rpc('increment_page_view', {
    p_business_id: biz.id,
    p_date: today,
  })

  if (error) {
    // Fallback: try a raw upsert (non-atomic but good enough for analytics)
    await supabase
      .from('page_views')
      .upsert(
        { business_id: biz.id, viewed_at: today, count: 1 },
        { onConflict: 'business_id,viewed_at', ignoreDuplicates: false }
      )
  }

  return NextResponse.json({ ok: true })
}
