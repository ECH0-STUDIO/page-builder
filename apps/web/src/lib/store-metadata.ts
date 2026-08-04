import type { Metadata } from 'next'
import { getPublicStoreUrl } from '@/lib/site-urls'

type StorePublishingMeta = {
  seo_title?: string | null
  seo_description?: string | null
  og_image_url?: string | null
  favicon_url?: string | null
  apple_touch_icon_url?: string | null
  gsc_verification?: string | null
  custom_domain?: string | null
  custom_domain_verified?: boolean | null
  language?: string | null
}

/** Canonical public URL — prefer verified custom domain when set. */
export function resolveStoreCanonicalUrl(
  slug: string,
  pub?: Pick<StorePublishingMeta, 'custom_domain' | 'custom_domain_verified'> | null,
  pathSuffix: string = '',
): string {
  const suffix = pathSuffix
    ? pathSuffix.startsWith('/')
      ? pathSuffix
      : `/${pathSuffix}`
    : ''

  if (pub?.custom_domain_verified && pub.custom_domain) {
    return `https://${pub.custom_domain}${suffix}`
  }
  return `${getPublicStoreUrl(slug)}${suffix}`
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
}): Metadata {
  const title = opts.title || opts.pub?.seo_title || opts.businessName
  const description =
    opts.description ||
    opts.pub?.seo_description ||
    `Visit ${opts.businessName} — menu, contact, and more.`
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
