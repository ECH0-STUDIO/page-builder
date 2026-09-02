'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Json } from '@/types/database'
import { normalizeMenuCategory, normalizeMenuItem, normalizeVariantGroups, normalizeVariantOptions } from '@/i18n/menu-content'
import { writeLocaleText, primaryPlainText } from '@/i18n/editor-locale-utils'
import type { SupportedLocale } from '@/i18n/locale'
import { toSupportedLocale } from '@/i18n/locale'

// ─── Types ───────────────────────────────────────────────────────────────────

export type MenuCategory = {
  id: string
  business_id: string
  name: string
  name_i18n?: Json | null
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
  name_i18n?: Json | null
  description: string | null
  description_i18n?: Json | null
  price: number
  image_url: string | null
  available: boolean
  sort_order: number
  tags: string[] | null
  /** Independent of tags — guest-facing vegetarian flag */
  is_vegetarian: boolean
  /** 0 none … 3 hot */
  spicy_level: number
  /** Pin to Featured strip on the order page (also stays in category) */
  is_featured: boolean
  created_at: string
  updated_at: string
}

export type VariantGroup = {
  id: string
  item_id: string
  name: string
  name_i18n?: Json | null
  required: boolean
  sort_order: number
  allow_multiple: boolean
}

export type VariantOption = {
  id: string
  group_id: string
  label: string
  label_i18n?: Json | null
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
    .select('business_id, businesses!inner(owner_id)')
    .eq('id', itemId)
    .single()
  if (!data) return false
  const ownerRecord = (data as any)?.businesses
  const ownerId = Array.isArray(ownerRecord) ? ownerRecord[0]?.owner_id : ownerRecord?.owner_id
  if (ownerId === userId) return true

  const businessId = (data as { business_id?: string }).business_id
  if (!businessId) return false
  const { data: member } = await supabase
    .from('business_members')
    .select('role')
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .maybeSingle()
  return member?.role === 'owner' || member?.role === 'manager'
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

  const { data, error } = await db
    .from('menu_categories')
    .insert({ business_id: businessId, name: trimmed, sort_order: nextOrder })
    .select()
    .single()

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/menu')
  return { success: true, data: normalizeMenuCategory(data as Record<string, unknown>) }
}

export async function updateCategoryAction(
  id: string,
  update: {
    name?: string
    name_i18n?: Json | null
    visible?: boolean
    sort_order?: number
    locale?: SupportedLocale
    primary_locale?: SupportedLocale
  }
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  if (!await userOwnsCategoryBusiness(supabase, id, user.id)) {
    return { success: false, error: 'Forbidden' }
  }

  const payload = { ...update } as Record<string, unknown>
  delete payload.locale
  delete payload.primary_locale

  if (update.name !== undefined && update.locale && update.primary_locale) {
    const primary = toSupportedLocale(update.primary_locale)
    const locale = toSupportedLocale(update.locale)
    const { data: existing } = await supabase
      .from('menu_categories')
      .select('name_i18n, name')
      .eq('id', id)
      .single()
    const name_i18n = writeLocaleText(
      (existing as { name_i18n?: Record<string, string> | null })?.name_i18n ?? existing?.name,
      locale,
      update.name.trim(),
      primary,
    )
    payload.name_i18n = name_i18n
    payload.name = primaryPlainText(name_i18n, primary)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
    .from('menu_categories')
    .update(payload as any)
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
    price: number
    image_url?: string
    tags?: string[]
    is_vegetarian?: boolean
    spicy_level?: number
    is_featured?: boolean
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
  const spicy = Math.min(3, Math.max(0, Math.floor(item.spicy_level ?? 0)))

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
      is_vegetarian: Boolean(item.is_vegetarian),
      spicy_level: spicy,
      is_featured: Boolean(item.is_featured),
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
    description: string | null
    name_i18n: Record<string, string> | null
    description_i18n: Record<string, string> | null
    price: number
    image_url: string | null
    available: boolean
    tags: string[]
    is_vegetarian: boolean
    spicy_level: number
    is_featured: boolean
    sort_order: number
    category_id: string
    locale: SupportedLocale
    primary_locale: SupportedLocale
  }>
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  if (!await userOwnsItemBusiness(supabase, id, user.id)) {
    return { success: false, error: 'Forbidden' }
  }

  const payload = { ...update } as Record<string, unknown>
  if (typeof update.spicy_level === 'number') {
    payload.spicy_level = Math.min(3, Math.max(0, Math.floor(update.spicy_level)))
  }

  if ((update.name !== undefined || update.description !== undefined) && update.locale && update.primary_locale) {
    const primary = toSupportedLocale(update.primary_locale)
    const locale = toSupportedLocale(update.locale)
    const { data: existing } = await supabase
      .from('menu_items')
      .select('name, description, name_i18n, description_i18n')
      .eq('id', id)
      .single()
    if (update.name !== undefined) {
      const name_i18n = writeLocaleText(
        (existing as { name_i18n?: Record<string, string> | null })?.name_i18n ?? existing?.name,
        locale,
        update.name.trim(),
        primary,
      )
      payload.name_i18n = name_i18n
      payload.name = primaryPlainText(name_i18n, primary)
    }
    if (update.description !== undefined) {
      const descSource =
        (existing as { description_i18n?: Record<string, string> | null })?.description_i18n
        ?? existing?.description
      const description_i18n = writeLocaleText(
        descSource,
        locale,
        update.description?.trim() ?? '',
        primary,
      )
      payload.description_i18n = description_i18n
      payload.description = primaryPlainText(description_i18n, primary) || null
    }
  }

  delete payload.locale
  delete payload.primary_locale

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
    .from('menu_items')
    .update(payload as any)
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

  const normalizedGroups = normalizeVariantGroups(groups as Record<string, unknown>[])
  const groupIds = normalizedGroups.map(g => g.id)
  const { data: options } = await db
    .from('menu_item_variant_options')
    .select('*')
    .in('group_id', groupIds)
    .order('sort_order', { ascending: true })

  return {
    groups: normalizedGroups,
    options: normalizeVariantOptions((options ?? []) as Record<string, unknown>[]),
  }
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
