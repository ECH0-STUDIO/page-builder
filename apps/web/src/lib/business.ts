/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_BUSINESS_CATEGORY } from '@/lib/constants'
import type { Database } from '@/types/database'

export type Business = Database['public']['Tables']['businesses']['Row'] & { role?: string }
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

/** Fetch all businesses for the current user (via server API — no direct Supabase auth on client). */
export async function getUserBusinesses(): Promise<Business[]> {
  try {
    const res = await fetch('/api/user-businesses', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      credentials: 'same-origin',
    })

    if (res.status === 401) return []

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`Failed to fetch user businesses (${res.status})${body ? `: ${body}` : ''}`)
    }

    const data = await res.json()
    return (data.businesses ?? []) as Business[]
  } catch (error) {
    console.error('[getUserBusinesses]', error)
    throw error
  }
}

/** Fetch a single business by ID */
export async function getBusinessById(id: string): Promise<Business | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Business
}

/** Create a new business — also creates default theme + publishing settings */
export async function createBusiness(input: { name: string; slug: string }): Promise<Business> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const db = supabase

  const { data: business, error } = await db
    .from('businesses')
    .insert({
      owner_id: user.id,
      name: input.name,
      slug: input.slug,
      category: [...DEFAULT_BUSINESS_CATEGORY],
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
  const { error } = await supabase
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
