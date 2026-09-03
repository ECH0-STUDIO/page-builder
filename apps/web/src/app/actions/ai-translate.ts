'use server'

import { getCreditBalanceAction } from '@/app/actions/credits'
import { getTranslationBundleAction, saveTranslationsAction } from '@/app/actions/translations'
import { deductCreditsInternal } from '@/lib/credits-internal'
import { estimateTranslateCredits, estimateTranslateVnd } from '@/lib/credit-packs'
import {
  selectTranslateFields,
  wordCountForFields,
  type AiTranslateScope,
  AI_TRANSLATE_SCOPES,
} from '@/lib/ai-translate'
import { isGeminiConfigured, translateFieldsWithGemini } from '@/lib/gemini-translate'
import { SECTION_LABELS, type TranslationField } from '@/lib/translation-fields'
import { isStoreLocaleCode, storeLocaleLabel } from '@/i18n/store-locales'

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

export type AiTranslateQuote = {
  scope: AiTranslateScope
  fieldCount: number
  wordCount: number
  credits: number
  vndEstimate: number
  balance: number
  insufficient: boolean
  configured: boolean
}

export type AiTranslateResult = {
  saved: number
  creditsCharged: number
  creditBalance?: number
  fields: TranslationField[]
}

function parseScope(raw: string): AiTranslateScope | null {
  return (AI_TRANSLATE_SCOPES as readonly string[]).includes(raw)
    ? (raw as AiTranslateScope)
    : null
}

async function quoteForScope(
  businessId: string,
  localeRaw: string,
  scope: AiTranslateScope,
): Promise<ActionResult<{
  quote: AiTranslateQuote
  selected: TranslationField[]
  locale: typeof localeRaw
}>> {
  if (!isStoreLocaleCode(localeRaw)) return { success: false, error: 'Unsupported language' }

  const bundle = await getTranslationBundleAction(businessId, localeRaw)
  if (!bundle.success) return bundle

  const selected = selectTranslateFields(bundle.data.fields, scope)
  const wordCount = wordCountForFields(selected)
  const credits = estimateTranslateCredits(wordCount)
  const balanceRes = await getCreditBalanceAction(businessId)
  const balance = balanceRes.success ? (balanceRes.data ?? 0) : 0

  return {
    success: true,
    data: {
      locale: localeRaw,
      selected,
      quote: {
        scope,
        fieldCount: selected.length,
        wordCount,
        credits,
        vndEstimate: estimateTranslateVnd(credits),
        balance,
        insufficient: credits > 0 && balance < credits,
        configured: isGeminiConfigured(),
      },
    },
  }
}

/** Word-count estimate only — no LLM. */
export async function estimateAiTranslateAction(
  businessId: string,
  localeRaw: string,
  scopeRaw: string,
): Promise<ActionResult<AiTranslateQuote>> {
  const scope = parseScope(scopeRaw)
  if (!scope) return { success: false, error: 'Invalid scope' }

  const quoted = await quoteForScope(businessId, localeRaw, scope)
  if (!quoted.success) return quoted
  return { success: true, data: quoted.data.quote }
}

/**
 * Translate untranslated fields in scope, save, then debit credits.
 * Debits only after a successful save. LLM failures are not charged.
 */
export async function applyAiTranslateAction(
  businessId: string,
  localeRaw: string,
  scopeRaw: string,
): Promise<ActionResult<AiTranslateResult>> {
  const scope = parseScope(scopeRaw)
  if (!scope) return { success: false, error: 'Invalid scope' }
  if (!isStoreLocaleCode(localeRaw)) return { success: false, error: 'Unsupported language' }

  const quoted = await quoteForScope(businessId, localeRaw, scope)
  if (!quoted.success) return quoted

  const { quote, selected } = quoted.data
  if (!selected.length) {
    return { success: false, error: 'Nothing left to translate in this section.' }
  }
  if (!quote.configured) {
    return {
      success: false,
      error: 'AI translation is not configured. Add GOOGLE_GENERATIVE_AI_API_KEY, or fill translations manually.',
    }
  }
  if (quote.insufficient) {
    return {
      success: false,
      error: `Need ${quote.credits} credits (balance ${quote.balance}). Top up first.`,
    }
  }

  const bundle = await getTranslationBundleAction(businessId, localeRaw)
  if (!bundle.success) return bundle

  let translations: Record<string, string>
  try {
    translations = await translateFieldsWithGemini(selected, bundle.data.primary, bundle.data.locale)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Translation failed'
    console.error('applyAiTranslateAction LLM error:', err)
    return { success: false, error: message }
  }

  const saved = await saveTranslationsAction(businessId, localeRaw, translations)
  if (!saved.success) return saved

  const label = storeLocaleLabel(bundle.data.locale)
  const scopeLabel = scope === 'all' ? 'all copy' : SECTION_LABELS[scope]
  const deduct = await deductCreditsInternal(
    businessId,
    quote.credits,
    `AI dịch ${label} (${scopeLabel}) — ${quote.wordCount} từ / ${quote.credits} Credits`,
  )
  if (!deduct.success) {
    console.error('applyAiTranslateAction debit failed after save:', deduct.error)
    // Translations already persisted — do not roll back; report charged=0.
    const refreshed = await getTranslationBundleAction(businessId, localeRaw)
    return {
      success: true,
      data: {
        saved: saved.data.saved,
        creditsCharged: 0,
        fields: refreshed.success ? refreshed.data.fields : bundle.data.fields,
      },
    }
  }

  const refreshed = await getTranslationBundleAction(businessId, localeRaw)
  return {
    success: true,
    data: {
      saved: saved.data.saved,
      creditsCharged: quote.credits,
      creditBalance: typeof deduct.balance === 'number' ? deduct.balance : undefined,
      fields: refreshed.success ? refreshed.data.fields : bundle.data.fields,
    },
  }
}
