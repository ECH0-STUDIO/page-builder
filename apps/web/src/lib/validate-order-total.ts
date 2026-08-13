import type { CartItem } from '@/components/page-builder/render/CartContext'
import type { createAdminClient } from '@/lib/supabase/server'

type AdminDb = ReturnType<typeof createAdminClient>

type MenuItemRow = {
  id: string
  price: number
  available: boolean
  name: string
}

export type ValidatedOrderLine = {
  itemId: string
  itemName: string
  quantity: number
  unitPrice: number
  variants: CartItem['variants']
}

/** Recompute order total from database prices — never trust client amounts. */
export async function validateAndComputeOrderTotal(
  db: AdminDb,
  businessId: string,
  items: CartItem[],
): Promise<
  | { ok: true; total: number; lines: ValidatedOrderLine[] }
  | { ok: false; error: string }
> {
  if (!items.length) {
    return { ok: false, error: 'Empty order' }
  }

  const itemIds = [...new Set(items.map(i => i.itemId))]
  const { data: menuItems, error: menuErr } = await db
    .from('menu_items')
    .select('id, price, available, name')
    .eq('business_id', businessId)
    .in('id', itemIds)

  if (menuErr) return { ok: false, error: menuErr.message }

  const itemMap = new Map<string, MenuItemRow>()
  for (const row of menuItems ?? []) {
    itemMap.set(row.id, row as MenuItemRow)
  }
  if (itemMap.size !== itemIds.length) {
    return { ok: false, error: 'Invalid menu items' }
  }

  const optionIds = [...new Set(items.flatMap(i => i.variants.map(v => v.optionId)))]
  const optionMap = new Map<string, { priceDelta: number; itemId: string }>()

  if (optionIds.length > 0) {
    const { data: options, error: optErr } = await db
      .from('menu_item_variant_options')
      .select('id, price_delta, group_id')
      .in('id', optionIds)

    if (optErr) return { ok: false, error: optErr.message }

    const groupIds = [...new Set((options ?? []).map(o => o.group_id))]
    const { data: groups, error: groupErr } = await db
      .from('menu_item_variant_groups')
      .select('id, item_id')
      .in('id', groupIds)

    if (groupErr) return { ok: false, error: groupErr.message }

    const groupItemMap = new Map((groups ?? []).map(g => [g.id, g.item_id as string]))

    for (const raw of options ?? []) {
      const itemId = groupItemMap.get(raw.group_id)
      if (!itemId) continue
      optionMap.set(raw.id, {
        priceDelta: Number(raw.price_delta) || 0,
        itemId,
      })
    }

    if (optionMap.size !== optionIds.length) {
      return { ok: false, error: 'Invalid variant options' }
    }
  }

  let total = 0
  const lines: ValidatedOrderLine[] = []

  for (const cartItem of items) {
    const menuItem = itemMap.get(cartItem.itemId)
    if (!menuItem) return { ok: false, error: 'Invalid menu items' }
    if (!menuItem.available) {
      return { ok: false, error: `Item unavailable: ${menuItem.name}` }
    }

    const quantity = Math.floor(Number(cartItem.quantity))
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
      return { ok: false, error: 'Invalid quantity' }
    }

    let unitPrice = Number(menuItem.price) || 0
    for (const variant of cartItem.variants) {
      const opt = optionMap.get(variant.optionId)
      if (!opt || opt.itemId !== cartItem.itemId) {
        return { ok: false, error: 'Invalid variant selection' }
      }
      unitPrice += opt.priceDelta
    }

    unitPrice = Math.round(unitPrice)
    total += unitPrice * quantity

    lines.push({
      itemId: cartItem.itemId,
      itemName: menuItem.name,
      quantity,
      unitPrice,
      variants: cartItem.variants,
    })
  }

  return { ok: true, total: Math.round(total), lines }
}
