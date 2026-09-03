import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PAGE_VIEWS_PER_CREDIT } from '@/lib/credit-packs'
import { isStoreLocaleCode, toStoreLocaleCode } from '@/i18n/store-locales'

/**
 * POST /api/view/[slug]?locale=en
 *
 * Increments the daily page_views counter (per locale for analytics)
 * and bills 1 credit / 500 views across ALL locales (shared pool).
 * Uses service-role key to bypass RLS (no auth needed from client).
 */
export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const url = new URL(req.url)
  const localeRaw = (url.searchParams.get('locale') ?? '').trim().toLowerCase()

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

  // Prefer explicit locale; otherwise tag as store primary (never leave blank → "Unknown")
  let locale = isStoreLocaleCode(localeRaw) ? localeRaw : ''
  if (!locale) {
    const { data: pub } = await supabase
      .from('publishing_settings')
      .select('language')
      .eq('business_id', biz.id)
      .maybeSingle()
    locale = toStoreLocaleCode((pub as { language?: string | null } | null)?.language)
  }

  const today = new Date().toISOString().slice(0, 10)

  // Atomic increment + bill when a new 500-view block is crossed
  const { error } = await supabase.rpc('increment_page_view_and_bill', {
    p_business_id: biz.id,
    p_date: today,
    p_views_per_credit: PAGE_VIEWS_PER_CREDIT,
    p_locale: locale,
  })

  if (error) {
    // Fallback: count the view even if billing RPC is unavailable (pre-migration)
    console.error('increment_page_view_and_bill error:', error.message)
    const { error: legacyErr } = await supabase.rpc('increment_page_view', {
      p_business_id: biz.id,
      p_date: today,
      p_locale: locale,
    })
    if (legacyErr) {
      // Last resort: try locale-aware upsert, then legacy unique key
      const { error: upsertErr } = await supabase
        .from('page_views')
        .upsert(
          { business_id: biz.id, viewed_at: today, locale, count: 1 },
          { onConflict: 'business_id,viewed_at,locale', ignoreDuplicates: false },
        )
      if (upsertErr) {
        await supabase
          .from('page_views')
          .upsert(
            { business_id: biz.id, viewed_at: today, count: 1 },
            { onConflict: 'business_id,viewed_at', ignoreDuplicates: false },
          )
      }
    }
  }

  return NextResponse.json({ ok: true })
}
