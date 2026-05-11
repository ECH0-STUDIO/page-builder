/**
 * Currency formatting utility
 *
 * Design for extensibility:
 * - Default currency is VND (no decimal, period thousands separator)
 * - Currency config is a simple record — add new currencies here in the future
 * - Language/locale support is built-in via Intl.NumberFormat
 */

export type CurrencyCode = 'VND' | 'USD' | 'EUR' | 'THB' | 'SGD'

export interface CurrencyConfig {
  code: CurrencyCode
  locale: string
  fractionDigits: number
  symbol: string
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  VND: { code: 'VND', locale: 'vi-VN', fractionDigits: 0, symbol: '₫' },
  USD: { code: 'USD', locale: 'en-US', fractionDigits: 2, symbol: '$' },
  EUR: { code: 'EUR', locale: 'de-DE', fractionDigits: 2, symbol: '€' },
  THB: { code: 'THB', locale: 'th-TH', fractionDigits: 0, symbol: '฿' },
  SGD: { code: 'SGD', locale: 'en-SG', fractionDigits: 2, symbol: 'S$' },
}

/** Default currency for the app (VND for now) */
export const DEFAULT_CURRENCY: CurrencyCode = 'VND'

/**
 * Format a numeric amount as a currency string.
 *
 * @example
 * formatCurrency(45000)           // "45.000 ₫"
 * formatCurrency(45000, 'VND')    // "45.000 ₫"
 * formatCurrency(9.99, 'USD')     // "$9.99"
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = DEFAULT_CURRENCY
): string {
  const config = CURRENCIES[currency] ?? CURRENCIES.VND
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: config.fractionDigits,
    maximumFractionDigits: config.fractionDigits,
  }).format(amount)
}

/**
 * Format a price delta (for variant options).
 * Returns "+45.000 ₫", "-5.000 ₫", or "Included".
 */
export function formatPriceDelta(
  delta: number,
  currency: CurrencyCode = DEFAULT_CURRENCY
): string {
  if (delta === 0) return 'Included'
  const formatted = formatCurrency(Math.abs(delta), currency)
  return delta > 0 ? `+${formatted}` : `-${formatted}`
}

/** Format as compact short string, e.g. 45000 → "45k₫", 1500000 → "1.5M₫" */
export function formatCurrencyCompact(
  amount: number,
  currency: CurrencyCode = DEFAULT_CURRENCY
): string {
  const config = CURRENCIES[currency] ?? CURRENCIES.VND
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toLocaleString(config.locale, { maximumFractionDigits: 1 })}M${config.symbol}`
  if (amount >= 1_000) return `${(amount / 1_000).toLocaleString(config.locale, { maximumFractionDigits: 0 })}k${config.symbol}`
  return formatCurrency(amount, currency)
}
