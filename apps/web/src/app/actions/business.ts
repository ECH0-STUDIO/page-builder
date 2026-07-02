'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { DEFAULT_BUSINESS_CATEGORY } from '@/lib/constants'

type CreateBusinessResult =
  | { success: true; businessId: string }
  | { success: false; error: string }

export async function createBusinessAction(input: {
  name: string
  slug: string
}): Promise<CreateBusinessResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Not authenticated — please sign in again.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase

  const { data: business, error: bizError } = await db
    .from('businesses')
    .insert({
      owner_id: user.id,
      name: input.name,
      slug: input.slug,
      category: [...DEFAULT_BUSINESS_CATEGORY],
    })
    .select()
    .single()

  if (bizError) {
    // Translate raw Postgres constraint errors to friendly messages
    if (bizError.code === '23505' && bizError.message?.includes('businesses_slug_key')) {
      return { success: false, error: 'That URL slug is already taken — please choose a different one.' }
    }
    if (bizError.code === '23503') {
      return { success: false, error: 'Session error — please sign out and sign back in.' }
    }
    return { success: false, error: bizError.message ?? 'Failed to create business' }
  }

  // Create default child records (errors are non-fatal)
  await db.from('theme_settings').insert({ business_id: business.id })
  await db.from('publishing_settings').insert({ business_id: business.id, published: false })
  await db.from('payment_settings').insert({ business_id: business.id })

  revalidatePath('/dashboard')
  return { success: true, businessId: business.id }
}

type UpdateBusinessResult =
  | { success: true }
  | { success: false; error: string }

export async function updateBusinessAction(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: Record<string, any>
): Promise<UpdateBusinessResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase

  const { error } = await db
    .from('businesses')
    .update(update as any)
    .eq('id', id)
    .eq('owner_id', user.id) // safety: only update own businesses

  if (error) {
    return { success: false, error: error.message ?? 'Failed to save' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/business')
  return { success: true }
}
