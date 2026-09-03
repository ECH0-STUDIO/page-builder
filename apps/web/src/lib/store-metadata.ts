import type { Metadata } from 'next'
import { resolvePublicStoreUrl, type StorePublicUrlMeta } from '@/lib/site-urls'
import { readLocaleText, type LocalizedString } from '@/i18n/localized-content'

type StorePublishingMeta = StorePublicUrlMeta & {
  seo_title?: string | null
  seo_description?: string | null
  seo_i18n?: unknown
  og_image_url?: string | null
  favicon_url?: string | null
  apple_touch_icon_url?: string | null
  gsc_verification?: string | null
  language?: string | null
}

/** Resolve SEO title/description for a content locale (primary fallback). */
export function resolveStoreSeoCopy(opts: {
  businessName: string
  pub?: StorePublishingMeta | null
  locale?: string
  primaryLocale?: string
  titleOverride?: string
  descriptionOverride?: string
  fallbackDescription?: string
}): { title: string; description: string } {
  const primary = opts.primaryLocale || 'vi'
  const locale = opts.locale || primary
  const map =
    opts.pub?.seo_i18n && typeof opts.pub.seo_i18n === 'object' && !Array.isArray(opts.pub.seo_i18n)
      ? (opts.pub.seo_i18n as Record<string, unknown>)
      : null

  const titleFromI18n = map
    ? readLocaleText(map.title as LocalizedString, locale, primary)
    : ''
  const descFromI18n = map
    ? readLocaleText(map.description as LocalizedString, locale, primary)
    : ''

  const title =
    opts.titleOverride
    || titleFromI18n
    || opts.pub?.seo_title
    || opts.businessName
  const description =
    opts.descriptionOverride
    || descFromI18n
    || opts.pub?.seo_description
    || opts.fallbackDescription
    || `Visit ${opts.businessName} — menu, contact, and more.`

  return { title, description }
}

/** Canonical public URL — prefer verified custom domain when set. */
export function resolveStoreCanonicalUrl(
  slug: string,
  pub?: StorePublicUrlMeta | null,
  pathSuffix: string = '',
): string {
  return resolvePublicStoreUrl(slug, pub, pathSuffix)
}

/**
 * Build Next.js Metadata for published store pages.
 * Puts GSC verification + canonical into <head> (body <meta> tags are not hoisted).
 */
export function buildStoreMetadata(opts: {
  slug: string
  businessName: string
  pub?: StorePublishingMeta | null
  title?: string
  description?: string
  pathSuffix?: string
  contentLocale?: string
  primaryLocale?: string
}): Metadata {
  const { title, description } = resolveStoreSeoCopy({
    businessName: opts.businessName,
    pub: opts.pub,
    locale: opts.contentLocale,
    primaryLocale: opts.primaryLocale,
    titleOverride: opts.title,
    descriptionOverride: opts.description,
  })
  const canonical = resolveStoreCanonicalUrl(opts.slug, opts.pub, opts.pathSuffix)
  const gsc = opts.pub?.gsc_verification?.trim()

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      ...(opts.pub?.og_image_url ? { images: [{ url: opts.pub.og_image_url }] } : {}),
    },
    twitter: {
      card: opts.pub?.og_image_url ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(opts.pub?.og_image_url ? { images: [opts.pub.og_image_url] } : {}),
    },
    icons: {
      icon: opts.pub?.favicon_url
        ? [{ url: opts.pub.favicon_url, sizes: '48x48', type: 'image/png' }]
        : undefined,
      apple: opts.pub?.apple_touch_icon_url
        ? [{ url: opts.pub.apple_touch_icon_url, sizes: '256x256', type: 'image/png' }]
        : undefined,
    },
    ...(gsc
      ? {
          verification: {
            google: gsc,
          },
        }
      : {}),
  }
}
