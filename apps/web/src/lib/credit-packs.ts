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

/** Page views billed at this rate (matches marketing / Publishing UI). All locales share one pool. */
export const PAGE_VIEWS_PER_CREDIT = 500

export const CUSTOM_DOMAIN_CREDITS_PER_MONTH = 50
export const STORAGE_CREDITS_PER_20MB = 1

/** Monthly cost per additional storefront content locale (Translation UI model). Primary locale is free. */
export const LOCALE_CREDITS_PER_MONTH = 20

/** AI bulk translate: credits = max(1, ceil(wordCount / AI_TRANSLATE_WORDS_PER_CREDIT)). */
export const AI_TRANSLATE_WORDS_PER_CREDIT = 300

export function estimateTranslateCredits(wordCount: number): number {
  if (wordCount <= 0) return 0
  return Math.max(1, Math.ceil(wordCount / AI_TRANSLATE_WORDS_PER_CREDIT))
}

export function findCreditPack(amount: number): CreditPack | undefined {
  return CREDIT_PACKS.find(p => p.amount === amount)
}
