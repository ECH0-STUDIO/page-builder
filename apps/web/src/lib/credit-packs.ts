/**
 * Shared credit pack catalog — server is source of truth for checkout.
 * Client UI must import from here; never trust client-supplied prices.
 */

export const CREDIT_PACKS = [
  { amount: 50, priceVnd: 50_000 },
  { amount: 100, priceVnd: 90_000 },
  { amount: 500, priceVnd: 400_000 },
] as const

export type CreditPack = (typeof CREDIT_PACKS)[number]

/** Page views billed at this rate (matches marketing / Publishing UI). */
export const PAGE_VIEWS_PER_CREDIT = 500

export const CUSTOM_DOMAIN_CREDITS_PER_MONTH = 50
export const STORAGE_CREDITS_PER_20MB = 1

export function findCreditPack(amount: number): CreditPack | undefined {
  return CREDIT_PACKS.find(p => p.amount === amount)
}
