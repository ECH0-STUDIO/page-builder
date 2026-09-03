/**
 * Pure helpers for AI bulk translate (word math, field selection, chunking).
 * No LLM calls here — estimate is math-only.
 */

import type { TranslationField, TranslationSectionId } from '@/lib/translation-fields'

export type AiTranslateScope = 'all' | TranslationSectionId

export const AI_TRANSLATE_SCOPES: AiTranslateScope[] = ['all', 'seo', 'page', 'chrome', 'menu', 'order']

const MAX_FIELDS_PER_CHUNK = 24
const MAX_WORDS_PER_CHUNK = 600

/** Strip HTML / entities, then count whitespace-separated tokens. */
export function countWords(text: string): number {
  const stripped = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
  if (!stripped) return 0
  return stripped.split(' ').filter(Boolean).length
}

export function isUntranslatedField(field: TranslationField): boolean {
  if (field.customized) return false
  const val = field.translatedText.trim()
  return !val || val === field.primaryText
}

export function selectTranslateFields(
  fields: TranslationField[],
  scope: AiTranslateScope,
): TranslationField[] {
  const scoped = scope === 'all' ? fields : fields.filter(f => f.section === scope)
  return scoped.filter(isUntranslatedField).filter(f => f.primaryText.trim())
}

export function wordCountForFields(fields: TranslationField[]): number {
  return fields.reduce((sum, f) => sum + countWords(f.primaryText), 0)
}

export function chunkTranslateFields(fields: TranslationField[]): TranslationField[][] {
  const chunks: TranslationField[][] = []
  let current: TranslationField[] = []
  let words = 0

  for (const field of fields) {
    const w = countWords(field.primaryText)
    const wouldOverflow =
      current.length > 0
      && (current.length >= MAX_FIELDS_PER_CHUNK || words + w > MAX_WORDS_PER_CHUNK)
    if (wouldOverflow) {
      chunks.push(current)
      current = []
      words = 0
    }
    current.push(field)
    words += w
  }
  if (current.length) chunks.push(current)
  return chunks
}
