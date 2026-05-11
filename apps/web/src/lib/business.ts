/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

export type Business = Database['public']['Tables']['businesses']['Row']
export type BusinessInsert = Database['public']['Tables']['businesses']['Insert']
export type BusinessUpdate = Database['public']['Tables']['businesses']['Update']

/** Slugify a string — lowercase, hyphens, no special chars */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

/** Check slug availability — returns true if available */
export async function checkSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  const res = await fetch(`/api/check-slug?slug=${encodeURIComponent(slug)}${excludeId ? `&exclude=${excludeId}` : ''}`)
  const data = await res.json()
  return data.available
}

/** Fetch all businesses for the current user */
export async function getUserBusinesses(): Promise<Business[]> {
  const supabase = createClient()
  const { data, error } = await (supabase as any)
    .from('businesses')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message ?? 'Failed to fetch businesses')
  return (data ?? []) as Business[]
}

/** Fetch a single business by ID */
export async function getBusinessById(id: string): Promise<Business | null> {
  const supabase = createClient()
  const { data, error } = await (supabase as any)
    .from('businesses')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Business
}

/** Create a new business — also creates default theme + publishing settings */
export async function createBusiness(input: { name: string; slug: string; category: string[] }): Promise<Business> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const db = supabase as any

  const { data: business, error } = await db
    .from('businesses')
    .insert({
      owner_id: user.id,
      name: input.name,
      slug: input.slug,
      category: input.category,
    })
    .select()
    .single()

  if (error) throw new Error(error.message ?? 'Failed to create business')

  // Create default records (errors here are non-fatal — business exists)
  await db.from('theme_settings').insert({ business_id: business.id })
  await db.from('publishing_settings').insert({ business_id: business.id, published: false })
  await db.from('payment_settings').insert({ business_id: business.id })

  return business as Business
}

/** Update business profile fields */
export async function updateBusiness(id: string, update: BusinessUpdate): Promise<void> {
  const supabase = createClient()
  const { error } = await (supabase as any)
    .from('businesses')
    .update(update)
    .eq('id', id)

  if (error) throw new Error(error.message ?? 'Failed to update business')
}

/** Upload a logo file → compresses client-side, returns public URL */
export async function uploadLogo(businessId: string, file: File): Promise<string> {
  const { uploadImageToStorage } = await import('@/lib/image-utils')
  // Logos shown at small sizes — 400×400, targeting ≤150 KB
  return uploadImageToStorage('logos', `${businessId}/logo.jpg`, file, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.88,
    targetSizeKB: 150,
  })
}
