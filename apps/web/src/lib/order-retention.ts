/**
 * Order history retention: current calendar month + previous 3 full months.
 * Example: any day in July → keep from April 1; August 1 hard-deletes April.
 */

export function getOrderRetentionCutoff(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth() - 3, 1, 0, 0, 0, 0)
}

/** Inclusive first day of the oldest kept month (local). */
export function getOrderRetentionCutoffIso(now: Date = new Date()): string {
  return getOrderRetentionCutoff(now).toISOString()
}

/** Days remaining in the current calendar month (including today). */
export function daysLeftInCurrentMonth(now: Date = new Date()): number {
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return lastDay - now.getDate() + 1
}

/** Show export reminder when ≤10 days remain before month rollover. */
export function shouldShowRetentionReminder(now: Date = new Date()): boolean {
  return daysLeftInCurrentMonth(now) <= 10
}

/** Label for the month that will be purged on the next rollover. */
export function getNextPurgedMonthLabel(now: Date = new Date(), locale = 'en'): string {
  const purged = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  return purged.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export const ORDER_REMOVE_REASONS = [
  'customer_cancels',
  'dish_not_available',
  'wrong_order',
] as const

export type OrderRemoveReasonCode = (typeof ORDER_REMOVE_REASONS)[number]

export const ORDER_REMOVE_REASON_LABELS: Record<OrderRemoveReasonCode, { en: string; vi: string }> = {
  customer_cancels: {
    en: 'Customer cancels order',
    vi: 'Khách hủy đơn',
  },
  dish_not_available: {
    en: 'Dish not available',
    vi: 'Món không còn',
  },
  wrong_order: {
    en: 'Wrong order',
    vi: 'Đơn sai',
  },
}
