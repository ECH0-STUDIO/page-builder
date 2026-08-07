/**
 * Guest (diner phone) localStorage helpers for table memory + placed-order history.
 * Keys are scoped by business; order history is further scoped by table.
 */

const TABLE_KEY = (businessId: string) => `eatery_table_${businessId}`
const ORDERS_KEY = (businessId: string, table: string) =>
  `eatery_orders_${businessId}_${normalizeTable(table)}`
/** Pre-table-scoped key — migrated into the first known table key when possible */
const LEGACY_ORDERS_KEY = (businessId: string) => `eatery_orders_${businessId}`
const LEGACY_LAST_ORDER_KEY = (businessId: string) => `eatery_last_order_${businessId}`

const ORDER_TTL_MS = 12 * 60 * 60 * 1000

export type GuestPastOrder = {
  id: string
  items: unknown[]
  total: number
  timestamp: number
  table?: string
}

export function normalizeTable(table: string): string {
  return table.trim().toLowerCase()
}

export function readRememberedTable(businessId: string): string {
  if (typeof window === 'undefined' || !businessId) return ''
  try {
    return (localStorage.getItem(TABLE_KEY(businessId)) ?? '').trim()
  } catch {
    return ''
  }
}

export function writeRememberedTable(businessId: string, table: string): void {
  if (typeof window === 'undefined' || !businessId) return
  const trimmed = table.trim()
  if (!trimmed) return
  try {
    localStorage.setItem(TABLE_KEY(businessId), trimmed)
  } catch {
    /* ignore quota / private mode */
  }
}

function filterRecent(orders: GuestPastOrder[]): GuestPastOrder[] {
  const now = Date.now()
  return orders.filter(o => typeof o.timestamp === 'number' && now - o.timestamp < ORDER_TTL_MS)
}

function parseOrders(raw: string | null): GuestPastOrder[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return filterRecent(parsed as GuestPastOrder[])
  } catch {
    return []
  }
}

/**
 * Load placed orders for business + table.
 * Migrates legacy business-only keys into the table-scoped key once.
 */
export function loadPastOrders(businessId: string, table: string): GuestPastOrder[] {
  if (typeof window === 'undefined' || !businessId || !table.trim()) return []

  const key = ORDERS_KEY(businessId, table)
  try {
    const scoped = parseOrders(localStorage.getItem(key))
    if (scoped.length > 0) {
      localStorage.setItem(key, JSON.stringify(scoped))
      return scoped
    }

    // Migrate business-only history into this table key
    const legacy = parseOrders(localStorage.getItem(LEGACY_ORDERS_KEY(businessId)))
    if (legacy.length > 0) {
      localStorage.setItem(key, JSON.stringify(legacy))
      localStorage.removeItem(LEGACY_ORDERS_KEY(businessId))
      return legacy
    }

    const lastRaw = localStorage.getItem(LEGACY_LAST_ORDER_KEY(businessId))
    if (lastRaw) {
      try {
        const one = JSON.parse(lastRaw) as GuestPastOrder
        const recent = filterRecent([one])
        if (recent.length > 0) {
          localStorage.setItem(key, JSON.stringify(recent))
        }
        localStorage.removeItem(LEGACY_LAST_ORDER_KEY(businessId))
        return recent
      } catch {
        localStorage.removeItem(LEGACY_LAST_ORDER_KEY(businessId))
      }
    }

    return []
  } catch {
    return []
  }
}

export function savePastOrders(
  businessId: string,
  table: string,
  orders: GuestPastOrder[],
): void {
  if (typeof window === 'undefined' || !businessId || !table.trim()) return
  try {
    localStorage.setItem(ORDERS_KEY(businessId, table), JSON.stringify(filterRecent(orders)))
  } catch {
    /* ignore */
  }
}
