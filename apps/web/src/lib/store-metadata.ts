import type { Metadata } from 'next'
import type { SupportedLocale } from '@/i18n/locale'
import { resolvePublicStoreUrl, type StorePublicUrlMeta } from '@/lib/site-urls'
import type { StoreLanguageConfig } from '@/i18n/store-locale'
import { storePublicPathForLocale } from '@/lib/store-routing'

type StorePublishingMeta = StorePublicUrlMeta & {
  seo_title?: string | null
  seo_description?: string | null
  seo_i18n?: Record<string, { title?: string; description?: string }> | null
  og_image_url?: string | null
  favicon_url?: string | null
  apple_touch_icon_url?: string | null
  gsc_verification?: string | null
  language?: string | null
}

/** Canonical public URL — prefer verified custom domain when set. */
export function resolveStoreCanonicalUrl(
  slug: string,
  pub?: StorePublicUrlMeta | null,
  pathSuffix: string = '',
): string {
  return resolvePublicStoreUrl(slug, pub, pathSuffix)
}

function absoluteStoreUrl(slug: string, pub: StorePublicUrlMeta | null | undefined, path: string): string {
  const origin = resolvePublicStoreUrl(slug, pub)
  const base = origin.replace(/\/$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Build Next.js Metadata for published store pages.
 * Canonical always points at the primary-locale URL; hreflang lists both when dual is on.
 */
export function buildStoreMetadata(opts: {
  slug: string
  businessName: string
  pub?: StorePublishingMeta | null
  title?: string
  description?: string
  pathSuffix?: string
  languageConfig?: StoreLanguageConfig
  activeLocale?: SupportedLocale
}): Metadata {
  const languageConfig = opts.languageConfig
  const activeLocale = opts.activeLocale ?? languageConfig?.primary_locale ?? 'vi'
  const primary = languageConfig?.primary_locale ?? 'vi'

  const seoI18n = opts.pub?.seo_i18n
  const localeSeo = seoI18n?.[activeLocale]

  const title =
    opts.title ||
    localeSeo?.title ||
    (activeLocale === primary ? opts.pub?.seo_title : null) ||
    opts.pub?.seo_title ||
    opts.businessName
  const description =
    opts.description ||
    localeSeo?.description ||
    (activeLocale === primary ? opts.pub?.seo_description : null) ||
    opts.pub?.seo_description ||
    `Visit ${opts.businessName} — menu, contact, and more.`

  const canonical = resolveStoreCanonicalUrl(opts.slug, opts.pub, opts.pathSuffix ?? '')
  const gsc = opts.pub?.gsc_verification?.trim()

  const alternates: Metadata['alternates'] = { canonical }

  if (languageConfig?.dual_language_enabled) {
    const primaryPath = storePublicPathForLocale(opts.slug, languageConfig, 'landing', primary)
    const secondaryPath = storePublicPathForLocale(
      opts.slug,
      languageConfig,
      'landing',
      languageConfig.secondary_locale,
    )
    alternates.languages = {
      [primary]: absoluteStoreUrl(opts.slug, opts.pub, primaryPath),
      [languageConfig.secondary_locale]: absoluteStoreUrl(opts.slug, opts.pub, secondaryPath),
    }
  }

  return {
    title,
    description,
    alternates,
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
