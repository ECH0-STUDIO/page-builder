'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { primaryLocalizedValue, type MenuI18nMap } from '@/i18n/locale'
import { normalizeMenuCategory, normalizeMenuItem } from '@/i18n/menu-content'

// ─── Types ───────────────────────────────────────────────────────────────────

export type MenuCategory = {
  id: string
  business_id: string
  name: string
  name_i18n?: MenuI18nMap | null
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
  name_i18n?: MenuI18nMap | null
  description: string | null
  description_i18n?: MenuI18nMap | null
  price: number
  image_url: string | null
  available: boolean
  sort_order: number
  tags: string[] | null
  created_at: string
  updated_at: string
}

export type VariantGroup = {
  id: string
  item_id: string
  name: string
  required: boolean
  sort_order: number
  allow_multiple: boolean
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

// ─── Ownership guard ─────────────────────────────────────────────────────────
// Verify that `user` owns the business that a given category belongs to.
async function userOwnsCategoryBusiness(supabase: Awaited<ReturnType<typeof createClient>>, categoryId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('menu_categories')
    .select('businesses!inner(owner_id)')
    .eq('id', categoryId)
    .single()
  const ownerRecord = (data as any)?.businesses
  return Array.isArray(ownerRecord) ? ownerRecord[0]?.owner_id === userId : ownerRecord?.owner_id === userId
}

async function userOwnsItemBusiness(supabase: Awaited<ReturnType<typeof createClient>>, itemId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('menu_items')
    .select('businesses!inner(owner_id)')
    .eq('id', itemId)
    .single()
  const ownerRecord = (data as any)?.businesses
  return Array.isArray(ownerRecord) ? ownerRecord[0]?.owner_id === userId : ownerRecord?.owner_id === userId
}

async function userOwnsVariantGroupBusiness(supabase: Awaited<ReturnType<typeof createClient>>, groupId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('menu_item_variant_groups')
    .select('menu_items!inner(businesses!inner(owner_id))')
    .eq('id', groupId)
    .single()
  const businesses = (data as any)?.menu_items?.businesses
  const ownerRecord = Array.isArray(businesses) ? businesses[0] : businesses
  return ownerRecord?.owner_id === userId
}

async function userOwnsVariantOptionBusiness(supabase: Awaited<ReturnType<typeof createClient>>, optionId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('menu_item_variant_options')
    .select('menu_item_variant_groups!inner(menu_items!inner(businesses!inner(owner_id)))')
    .eq('id', optionId)
    .single()
  const businesses = (data as any)?.menu_item_variant_groups?.menu_items?.businesses
  const ownerRecord = Array.isArray(businesses) ? businesses[0] : businesses
  return ownerRecord?.owner_id === userId
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function addCategoryAction(
  businessId: string,
  name: string,
  name_i18n?: MenuI18nMap | null,
): Promise<ActionResult<MenuCategory>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase

  const { data: existing } = await db
    .from('menu_categories')
    .select('sort_order')
    .eq('business_id', businessId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const trimmed = name.trim()
  const i18n = name_i18n ?? { vi: trimmed, en: trimmed }

  const { data, error } = await db
    .from('menu_categories')
    .insert({ business_id: businessId, name: primaryLocalizedValue(i18n) || trimmed, name_i18n: i18n, sort_order: nextOrder })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/menu')
  return { success: true, data: normalizeMenuCategory(data as Record<string, unknown>) }
}

export async function updateCategoryAction(
  id: string,
  update: { name?: string; name_i18n?: MenuI18nMap | null; visible?: boolean; sort_order?: number }
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  if (!await userOwnsCategoryBusiness(supabase, id, user.id)) {
    return { success: false, error: 'Forbidden' }
  }

  const payload = { ...update }
  if (update.name_i18n) {
    payload.name = primaryLocalizedValue(update.name_i18n) || update.name
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
    .from('menu_categories')
    .update(payload)
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/menu')
  return { success: true, data: undefined }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  if (!await userOwnsCategoryBusiness(supabase, id, user.id)) {
    return { success: false, error: 'Forbidden' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
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
    name_i18n?: MenuI18nMap | null
    description_i18n?: MenuI18nMap | null
    price: number
    image_url?: string
    tags?: string[]
  }
): Promise<ActionResult<MenuItem>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase

  const { data: existing } = await db
    .from('menu_items')
    .select('sort_order')
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const nameI18n = item.name_i18n ?? { vi: item.name.trim(), en: item.name.trim() }
  const descI18n = item.description_i18n ?? (
    item.description?.trim()
      ? { vi: item.description.trim(), en: item.description.trim() }
      : null
  )

  const { data, error } = await db
    .from('menu_items')
    .insert({
      business_id: businessId,
      category_id: categoryId,
      name: primaryLocalizedValue(nameI18n) || item.name.trim(),
      name_i18n: nameI18n,
      description: primaryLocalizedValue(descI18n) || item.description?.trim() || null,
      description_i18n: descI18n,
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
  return { success: true, data: normalizeMenuItem(data as Record<string, unknown>) }
}

export async function updateItemAction(
  id: string,
  update: Partial<{
    name: string
    name_i18n: MenuI18nMap | null
    description: string | null
    description_i18n: MenuI18nMap | null
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

  if (!await userOwnsItemBusiness(supabase, id, user.id)) {
    return { success: false, error: 'Forbidden' }
  }

  const payload = { ...update }
  if (update.name_i18n) {
    payload.name = primaryLocalizedValue(update.name_i18n) || update.name
  }
  if (update.description_i18n !== undefined) {
    payload.description = primaryLocalizedValue(update.description_i18n) || update.description || null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
    .from('menu_items')
    .update(payload)
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/menu')
  return { success: true, data: undefined }
}

export async function deleteItemAction(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  if (!await userOwnsItemBusiness(supabase, id, user.id)) {
    return { success: false, error: 'Forbidden' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
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
  const db = supabase

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
  required: boolean,
  allow_multiple: boolean = false
): Promise<ActionResult<VariantGroup>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase

  const { data: existing } = await db
    .from('menu_item_variant_groups')
    .select('sort_order')
    .eq('item_id', itemId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const { data, error } = await db
    .from('menu_item_variant_groups')
    .insert({ item_id: itemId, name: name.trim(), required, allow_multiple, sort_order: nextOrder })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function updateVariantGroupAction(
  id: string,
  update: { name?: string; required?: boolean; allow_multiple?: boolean }
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  if (!await userOwnsVariantGroupBusiness(supabase, id, user.id)) {
    return { success: false, error: 'Forbidden' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
    .from('menu_item_variant_groups')
    .update(update)
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  return { success: true, data: undefined }
}

export async function deleteVariantGroupAction(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  if (!await userOwnsVariantGroupBusiness(supabase, id, user.id)) {
    return { success: false, error: 'Forbidden' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
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
  const db = supabase

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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  if (!await userOwnsVariantOptionBusiness(supabase, id, user.id)) {
    return { success: false, error: 'Forbidden' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
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
  const { error } = await supabase
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
  const { error } = await supabase
    .from('menu_items')
    .update({ available })
    .in('id', ids)

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/menu')
  return { success: true, data: undefined }
}
