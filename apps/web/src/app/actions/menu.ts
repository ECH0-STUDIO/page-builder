'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Types ───────────────────────────────────────────────────────────────────

export type MenuCategory = {
  id: string
  business_id: string
  name: string
  sort_order: number
  visible: boolean
  created_at: string
  updated_at: string
}

export type MenuItem = {
  id: string
  business_id: string
  category_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  available: boolean
  sort_order: number
  tags: string[]
  created_at: string
  updated_at: string
}

export type VariantGroup = {
  id: string
  item_id: string
  name: string
  required: boolean
  sort_order: number
}

export type VariantOption = {
  id: string
  group_id: string
  label: string
  price_delta: number
  sort_order: number
}

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// ─── Categories ──────────────────────────────────────────────────────────────

export async function addCategoryAction(
  businessId: string,
  name: string
): Promise<ActionResult<MenuCategory>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: existing } = await db
    .from('menu_categories')
    .select('sort_order')
    .eq('business_id', businessId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const { data, error } = await db
    .from('menu_categories')
    .insert({ business_id: businessId, name: name.trim(), sort_order: nextOrder })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/menu')
  return { success: true, data }
}

export async function updateCategoryAction(
  id: string,
  update: { name?: string; visible?: boolean; sort_order?: number }
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('menu_categories')
    .update(update)
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/menu')
  return { success: true, data: undefined }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('menu_categories')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/menu')
  return { success: true, data: undefined }
}

// ─── Menu Items ───────────────────────────────────────────────────────────────

export async function addItemAction(
  businessId: string,
  categoryId: string,
  item: {
    name: string
    description?: string
    price: number
    image_url?: string
    tags?: string[]
  }
): Promise<ActionResult<MenuItem>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: existing } = await db
    .from('menu_items')
    .select('sort_order')
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const { data, error } = await db
    .from('menu_items')
    .insert({
      business_id: businessId,
      category_id: categoryId,
      name: item.name.trim(),
      description: item.description?.trim() || null,
      price: item.price,
      image_url: item.image_url || null,
      tags: item.tags ?? [],
      sort_order: nextOrder,
      available: true,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/menu')
  return { success: true, data }
}

export async function updateItemAction(
  id: string,
  update: Partial<{
    name: string
    description: string | null
    price: number
    image_url: string | null
    available: boolean
    tags: string[]
    sort_order: number
    category_id: string
  }>
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('menu_items')
    .update(update)
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/menu')
  return { success: true, data: undefined }
}

export async function deleteItemAction(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('menu_items')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/menu')
  return { success: true, data: undefined }
}

// ─── Variant Groups ───────────────────────────────────────────────────────────

export async function getItemVariantsAction(itemId: string): Promise<{
  groups: VariantGroup[]
  options: VariantOption[]
}> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: groups } = await db
    .from('menu_item_variant_groups')
    .select('*')
    .eq('item_id', itemId)
    .order('sort_order', { ascending: true })

  if (!groups?.length) return { groups: [], options: [] }

  const groupIds = groups.map((g: VariantGroup) => g.id)
  const { data: options } = await db
    .from('menu_item_variant_options')
    .select('*')
    .in('group_id', groupIds)
    .order('sort_order', { ascending: true })

  return { groups: groups ?? [], options: options ?? [] }
}

export async function addVariantGroupAction(
  itemId: string,
  name: string,
  required: boolean
): Promise<ActionResult<VariantGroup>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: existing } = await db
    .from('menu_item_variant_groups')
    .select('sort_order')
    .eq('item_id', itemId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const { data, error } = await db
    .from('menu_item_variant_groups')
    .insert({ item_id: itemId, name: name.trim(), required, sort_order: nextOrder })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function updateVariantGroupAction(
  id: string,
  update: { name?: string; required?: boolean }
): Promise<ActionResult> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('menu_item_variant_groups')
    .update(update)
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true, data: undefined }
}

export async function deleteVariantGroupAction(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('menu_item_variant_groups')
    .delete()
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true, data: undefined }
}

// ─── Variant Options ──────────────────────────────────────────────────────────

export async function addVariantOptionAction(
  groupId: string,
  label: string,
  priceDelta: number
): Promise<ActionResult<VariantOption>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: existing } = await db
    .from('menu_item_variant_options')
    .select('sort_order')
    .eq('group_id', groupId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const { data, error } = await db
    .from('menu_item_variant_options')
    .insert({ group_id: groupId, label: label.trim(), price_delta: priceDelta, sort_order: nextOrder })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function deleteVariantOptionAction(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('menu_item_variant_options')
    .delete()
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true, data: undefined }
}

// ─── Bulk Item Actions ────────────────────────────────────────────────────────

export async function bulkDeleteItemsAction(ids: string[]): Promise<ActionResult> {
  if (!ids.length) return { success: true, data: undefined }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('menu_items')
    .delete()
    .in('id', ids)

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/menu')
  return { success: true, data: undefined }
}

export async function bulkUpdateAvailabilityAction(
  ids: string[],
  available: boolean
): Promise<ActionResult> {
  if (!ids.length) return { success: true, data: undefined }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('menu_items')
    .update({ available })
    .in('id', ids)

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/menu')
  return { success: true, data: undefined }
}
