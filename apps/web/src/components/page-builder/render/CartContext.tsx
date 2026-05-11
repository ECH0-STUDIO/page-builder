'use client'

/**
 * CartContext — lightweight session-only cart for the live customer menu.
 * No backend, no persistence — intentionally ephemeral (table-side ordering UX).
 */

import { createContext, useCallback, useContext, useState } from 'react'
import type { MenuItem } from '@/app/actions/menu'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartVariantSelection {
  groupId: string
  groupName: string
  optionId: string
  optionLabel: string
  priceDelta: number
}

export interface CartItem {
  /** Unique per entry — same menu item can appear multiple times with different variants */
  cartId: string
  itemId: string
  itemName: string
  itemImage: string | null
  basePrice: number
  variants: CartVariantSelection[]
  /** basePrice + sum of selected variant price deltas */
  totalPrice: number
  quantity: number
}

interface CartContextValue {
  items: CartItem[]
  addItem: (item: MenuItem, variants: CartVariantSelection[]) => void
  removeItem: (cartId: string) => void
  /** delta = +1 or -1; removes item when quantity reaches 0 */
  updateQuantity: (cartId: string, delta: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((item: MenuItem, variants: CartVariantSelection[]) => {
    const variantTotal = variants.reduce((s, v) => s + v.priceDelta, 0)
    const totalPrice = item.price + variantTotal
    
    setItems(prev => {
      // Look for an identical item (same ID OR same name+price, with same variants)
      const existingIndex = prev.findIndex(i => {
        const isSameItem = i.itemId === item.id || (i.itemName === item.name && i.basePrice === item.price)
        if (!isSameItem) return false
        if (i.variants.length !== variants.length) return false
        // Both variant arrays must have the same option IDs
        return variants.every(v => i.variants.some(ev => ev.optionId === v.optionId))
      })

      if (existingIndex >= 0) {
        const newItems = [...prev]
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + 1
        }
        return newItems
      }

      const cartId = `${item.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`
      return [...prev, {
        cartId,
        itemId: item.id,
        itemName: item.name,
        itemImage: item.image_url,
        basePrice: item.price,
        variants,
        totalPrice,
        quantity: 1,
      }]
    })
  }, [])

  const removeItem = useCallback((cartId: string) => {
    setItems(prev => prev.filter(i => i.cartId !== cartId))
  }, [])

  const updateQuantity = useCallback((cartId: string, delta: number) => {
    setItems(prev =>
      prev
        .map(i => i.cartId === cartId ? { ...i, quantity: i.quantity + delta } : i)
        .filter(i => i.quantity > 0)
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((s, i) => s + i.quantity, 0)
  const totalPrice = items.reduce((s, i) => s + i.totalPrice * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
