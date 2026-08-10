/** Helpers to turn raw order_events rows into readable history labels. */

export type OrderLogEventRow = {
  action: string
  entity_type?: string | null
  before?: unknown
  after?: unknown
  reason?: string | null
  order_id?: string | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

export function getServiceRequestMeta(event: OrderLogEventRow): {
  type?: string
  table?: string
} {
  const before = asRecord(event.before)
  const after = asRecord(event.after)
  const type = (before?.type ?? after?.type) as string | undefined
  const table = (before?.table_number ?? after?.table_number) as string | undefined
  return { type, table }
}

/** Human-readable action label (falls back to prettified raw action). */
export function formatOrderLogAction(
  action: string,
  t: (key: string) => string,
): string {
  const key = `orders.logActions.${action}`
  const translated = t(key)
  if (translated !== key) return translated
  return action.replace(/_/g, ' ')
}

/** Secondary line — table, request type, item name, etc. */
export function formatOrderLogDetail(
  event: OrderLogEventRow,
  t: (key: string) => string,
): string | null {
  const before = asRecord(event.before)
  const after = asRecord(event.after)

  if (
    event.entity_type === 'service_request'
    || event.action === 'request_accepted'
    || event.action === 'request_dismissed'
  ) {
    const { type, table } = getServiceRequestMeta(event)
    const parts: string[] = []
    if (table) parts.push(`${t('orders.table')} ${table}`)
    if (type === 'call_staff') parts.push(t('orders.callStaffRequest'))
    else if (type === 'request_check') parts.push(t('orders.requestCheckRequest'))
    return parts.length > 0 ? parts.join(' · ') : null
  }

  if (event.action === 'created') {
    const table = after?.table_number as string | null | undefined
    if (table) return `${t('orders.table')} ${table}`
    return t('orders.takeaway')
  }

  if (event.action === 'item_removed') {
    const name = before?.item_name
    if (typeof name === 'string' && name.trim()) return name
  }

  if (event.action === 'edited') {
    const prevTable = before?.table_number as string | null | undefined
    const nextTable = after?.table_number as string | null | undefined
    if (prevTable !== nextTable) {
      const from = prevTable ? `${t('orders.table')} ${prevTable}` : t('orders.takeaway')
      const to = nextTable ? `${t('orders.table')} ${nextTable}` : t('orders.takeaway')
      return `${from} → ${to}`
    }
  }

  return null
}

/** Flat string for search / CSV detail column. */
export function orderLogSearchText(
  event: OrderLogEventRow,
  t: (key: string) => string,
): string {
  return [
    formatOrderLogAction(event.action, t),
    formatOrderLogDetail(event, t),
    event.reason,
    event.order_id,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

const LOG_ACTION_EN: Record<string, string> = {
  created: 'Order placed',
  completed: 'Order completed',
  paid: 'Order paid',
  cancelled: 'Order removed',
  restored: 'Order restored',
  edited: 'Order edited',
  item_updated: 'Item updated',
  item_removed: 'Item removed',
  request_accepted: 'Request accepted',
  request_dismissed: 'Request dismissed',
}

const REQUEST_TYPE_EN: Record<string, string> = {
  call_staff: 'Call staff',
  request_check: 'Request check',
}

/** English labels for CSV export (no i18n context on server). */
export function formatOrderLogDetailEn(event: OrderLogEventRow): string {
  const before = asRecord(event.before)
  const after = asRecord(event.after)

  if (
    event.entity_type === 'service_request'
    || event.action === 'request_accepted'
    || event.action === 'request_dismissed'
  ) {
    const { type, table } = getServiceRequestMeta(event)
    const parts: string[] = []
    if (table) parts.push(`Table ${table}`)
    if (type && REQUEST_TYPE_EN[type]) parts.push(REQUEST_TYPE_EN[type])
    return parts.join(' · ')
  }

  if (event.action === 'created') {
    const table = after?.table_number as string | null | undefined
    return table ? `Table ${table}` : 'Takeaway'
  }

  if (event.action === 'item_removed') {
    const name = before?.item_name
    if (typeof name === 'string' && name.trim()) return name
  }

  if (event.action === 'edited') {
    const prevTable = before?.table_number as string | null | undefined
    const nextTable = after?.table_number as string | null | undefined
    if (prevTable !== nextTable) {
      const from = prevTable ? `Table ${prevTable}` : 'Takeaway'
      const to = nextTable ? `Table ${nextTable}` : 'Takeaway'
      return `${from} → ${to}`
    }
  }

  return ''
}

export function formatOrderLogActionEn(action: string): string {
  return LOG_ACTION_EN[action] ?? action.replace(/_/g, ' ')
}
