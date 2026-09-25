/**
 * Landing-page SEO draft vs live.
 * The page builder writes seo_* columns immediately. The public store keeps
 * reading `published_seo` until the owner publishes, same as published_blocks.
 */

import {
  applyLocaleChange,
  primaryPlainText,
  setPrimaryLocaleText,
  type LocalizedString,
} from '@/i18n/localized-content'

export const PUBLISHED_SEO_KEYS = [
  'seo_title',
  'seo_description',
  'og_image_url',
  'favicon_url',
  'apple_touch_icon_url',
  'gsc_verification',
  'google_analytics_id',
  'facebook_pixel_id',
  'tiktok_pixel_id',
  'seo_i18n',
] as const

export type PublishedSeoKey = (typeof PUBLISHED_SEO_KEYS)[number]

export type PublishedSeoSnapshot = {
  seo_title: string | null
  seo_description: string | null
  og_image_url: string | null
  favicon_url: string | null
  apple_touch_icon_url: string | null
  gsc_verification: string | null
  google_analytics_id: string | null
  facebook_pixel_id: string | null
  tiktok_pixel_id: string | null
  seo_i18n: Record<string, unknown>
}

const STRING_KEYS = PUBLISHED_SEO_KEYS.filter((key) => key !== 'seo_i18n')

function nullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function cloneI18n(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>
}

export function isPublishedSeoSnapshot(value: unknown): value is PublishedSeoSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  return PUBLISHED_SEO_KEYS.every((key) => key in (value as object))
}

export function seoSnapshotFromRow(
  row: Record<string, unknown> | null | undefined,
): PublishedSeoSnapshot {
  const source = row ?? {}
  const snapshot = {
    seo_i18n: cloneI18n(source.seo_i18n),
  } as PublishedSeoSnapshot
  for (const key of STRING_KEYS) {
    snapshot[key] = nullableString(source[key])
  }
  return snapshot
}

export function publishedSeoEquals(a: PublishedSeoSnapshot, b: PublishedSeoSnapshot): boolean {
  return PUBLISHED_SEO_KEYS.every((key) => {
    if (key === 'seo_i18n') {
      return JSON.stringify(a.seo_i18n) === JSON.stringify(b.seo_i18n)
    }
    return (a[key] ?? null) === (b[key] ?? null)
  })
}

/** Public store fields. Prefer the last publish snapshot over the editor draft. */
export function resolveLiveSeo<T extends Record<string, unknown>>(
  pub: T | null | undefined,
): T | null {
  if (!pub) return (pub ?? null) as T | null
  const snap = pub.published_seo
  if (!isPublishedSeoSnapshot(snap)) return pub
  return { ...pub, ...snap }
}

/**
 * Apply one translation edit onto the live SEO snapshot.
 * A non-primary locale stays inside seo_i18n so an unpublished page-builder
 * title does not replace the live primary text.
 */
export function patchPublishedSeoLocale(
  snapshot: PublishedSeoSnapshot,
  locale: string,
  primary: string,
  patches: { title?: string | null; description?: string | null },
): PublishedSeoSnapshot {
  const existing = cloneI18n(snapshot.seo_i18n)
  const titleSource = setPrimaryLocaleText(
    (existing.title as LocalizedString) ?? snapshot.seo_title ?? '',
    snapshot.seo_title ?? '',
    primary,
  )
  const descSource = setPrimaryLocaleText(
    (existing.description as LocalizedString) ?? snapshot.seo_description ?? '',
    snapshot.seo_description ?? '',
    primary,
  )
  const next: Record<string, unknown> = { ...existing }
  if (patches.title !== undefined) {
    next.title = applyLocaleChange(titleSource, locale, patches.title, primary)
  }
  if (patches.description !== undefined) {
    next.description = applyLocaleChange(descSource, locale, patches.description, primary)
  }

  const primaryEdit = locale === primary
  return {
    ...snapshot,
    seo_i18n: next,
    seo_title:
      primaryEdit && patches.title !== undefined
        ? nullableString(primaryPlainText(next.title as LocalizedString, primary)) ?? snapshot.seo_title
        : snapshot.seo_title,
    seo_description:
      primaryEdit && patches.description !== undefined
        ? nullableString(primaryPlainText(next.description as LocalizedString, primary)) ?? snapshot.seo_description
        : snapshot.seo_description,
  }
}
