import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')?.toLowerCase().trim()
  const exclude = searchParams.get('exclude') ?? null // business ID to exclude (for editing)

  if (!slug || slug.length < 2) {
    return NextResponse.json({ available: false, error: 'Slug too short' })
  }

  const supabase = await createClient()

  // Use a security definer RPC so slug uniqueness is checked
  // across ALL businesses regardless of RLS policies.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: available, error } = await (supabase as any).rpc('check_slug_available', {
    p_slug: slug,
    p_exclude_id: exclude,
  })

  if (error) {
    // Fallback: if function doesn't exist yet, assume taken to be safe
    console.error('check_slug_available RPC error:', error.message)
    return NextResponse.json({ available: false, error: error.message })
  }

  return NextResponse.json({ available: available === true })
}
