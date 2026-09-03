/**
 * Server-only Gemini translation via Vercel AI SDK.
 */

import 'server-only'
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'
import { storeLocaleLabel, type StoreLocaleCode } from '@/i18n/store-locales'
import type { TranslationField } from '@/lib/translation-fields'
import { chunkTranslateFields } from '@/lib/ai-translate'

const GEMINI_MODEL = 'gemini-2.5-flash'

const chunkSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    text: z.string(),
  })),
})

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim())
}

function buildPrompt(
  fields: TranslationField[],
  primary: StoreLocaleCode,
  locale: StoreLocaleCode,
): string {
  const from = storeLocaleLabel(primary)
  const to = storeLocaleLabel(locale)
  const payload = fields.map(f => ({ id: f.id, text: f.primaryText }))
  return `You translate guest-facing restaurant / cafe storefront copy.

Source language: ${from} (${primary})
Target language: ${to} (${locale})

Rules:
- Natural, concise copy for diners — not a literal word-for-word gloss if that sounds awkward.
- Keep brand names, dish names that are already in the target language, numbers, prices, URLs, emails, and emoji unchanged.
- Do not add explanations, quotes, or extra punctuation the source did not have.
- Return one item per input id. Every id must appear exactly once.

Input JSON:
${JSON.stringify(payload)}`
}

async function translateChunk(
  fields: TranslationField[],
  primary: StoreLocaleCode,
  locale: StoreLocaleCode,
): Promise<Record<string, string>> {
  const { object } = await generateObject({
    model: google(GEMINI_MODEL),
    schema: chunkSchema,
    prompt: buildPrompt(fields, primary, locale),
  })

  const wanted = new Set(fields.map(f => f.id))
  const out: Record<string, string> = {}
  for (const item of object.items) {
    if (!wanted.has(item.id)) continue
    const text = typeof item.text === 'string' ? item.text.trim() : ''
    if (text) out[item.id] = text
  }

  const missing = fields.filter(f => !out[f.id])
  if (missing.length) {
    throw new Error(`Translation incomplete (${missing.length} field${missing.length === 1 ? '' : 's'} missing). Try again.`)
  }
  return out
}

/** Translate all selected fields. Throws on LLM / validation failure. */
export async function translateFieldsWithGemini(
  fields: TranslationField[],
  primary: StoreLocaleCode,
  locale: StoreLocaleCode,
): Promise<Record<string, string>> {
  if (!isGeminiConfigured()) {
    throw new Error('AI translation is not configured. Add GOOGLE_GENERATIVE_AI_API_KEY, or fill translations manually.')
  }
  if (!fields.length) return {}

  const merged: Record<string, string> = {}
  for (const chunk of chunkTranslateFields(fields)) {
    const part = await translateChunk(chunk, primary, locale)
    Object.assign(merged, part)
  }
  return merged
}
