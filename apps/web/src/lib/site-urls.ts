/**
 * Marketing site (eatery.com) vs app (app.eatery.com).
 * In local dev both default to localhost — no host split.
 */

import type { SupportedLocale } from '@/i18n/locale'
import { buildStorePublicPath, type StorePublicPathKind } from '@/i18n/store-locale'

function normalizeUrl(raw: string): string {
  const withProtocol = raw.startsWith('http') ? raw : `https://${raw}`
  return withProtocol.replace(/\/$/, '')
}

export function getMarketingBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_MARKETING_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'
  return normalizeUrl(raw)
}

export function getAppBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return normalizeUrl(raw)
}

export function getMarketingHostname(): string {
  return new URL(getMarketingBaseUrl()).hostname.toLowerCase()
}

export function getAppHostname(): string {
  return new URL(getAppBaseUrl()).hostname.toLowerCase()
}

/** Strip www. for comparing apex vs www marketing hosts */
export function normalizeSiteHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, '')
}

/** Marketing host — apex and www (eateryvn.com + www.eateryvn.com) */
export function isMarketingHostname(
  requestHost: string | undefined,
  configuredMarketingHost: string
): boolean {
  if (!requestHost) return false
  const host = requestHost.toLowerCase()
  const target = configuredMarketingHost.toLowerCase()
  const bare = normalizeSiteHostname(target)
  return host === target || host === bare || host === `www.${bare}`
}

/**
 * App host — exact match only (app.eateryvn.com).
 * Never treat www marketing apex as the app host when env URLs are misconfigured.
 */
export function isAppHostname(
  requestHost: string | undefined,
  configuredAppHost: string
): boolean {
  if (!requestHost) return false
  return requestHost.toLowerCase() === configuredAppHost.toLowerCase()
}

export function marketingPath(path: string = ''): string {
  const base = getMarketingBaseUrl()
  if (!path || path === '/') return base
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export function appPath(path: string = ''): string {
  const base = getAppBaseUrl()
  if (!path || path === '/') return base
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

/** Canonical public store page URL — served on marketing host when split. */
export function getPublicStoreUrl(slug: string): string {
  const clean = slug.replace(/^\/+/, '')
  if (isSplitDomainDeployment()) {
    return `${getMarketingBaseUrl()}/${clean}`
  }
  return `${getAppBaseUrl()}/${clean}`
}

/** Publishing fields used to prefer a verified custom domain. */
export type StorePublicUrlMeta = {
  custom_domain?: string | null
  custom_domain_verified?: boolean | null
}

/**
 * Public storefront URL — prefer verified custom domain when connected.
 * `pathSuffix` examples: '', '/order', '/order?table=3'
 */
export function resolvePublicStoreUrl(
  slug: string,
  pub?: StorePublicUrlMeta | null,
  pathSuffix: string = '',
): string {
  const cleanSlug = slug.replace(/^\/+/, '')
  let suffix = ''
  if (pathSuffix) {
    suffix = pathSuffix.startsWith('/') || pathSuffix.startsWith('?')
      ? pathSuffix
      : `/${pathSuffix}`
  }

  const domain = pub?.custom_domain?.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
  if (pub?.custom_domain_verified && domain) {
    // Custom domain root is the store landing (no /{slug} prefix after rewrite).
    return `https://${domain}${suffix}`
  }

  return `${getPublicStoreUrl(cleanSlug)}${suffix}`
}

/** Strip slug from internal store path → public path suffix (custom domain omits slug). */
function publicPathSuffixFromStorePath(path: string, slug: string): string {
  const cleanSlug = slug.replace(/^\/+/, '')
  const segments = path.split('/').filter(Boolean)
  const slugIdx = segments.indexOf(cleanSlug)
  if (slugIdx < 0) return path.startsWith('/') ? path : `/${path}`

  const beforeSlug = segments.slice(0, slugIdx)
  const afterSlug = segments.slice(slugIdx + 1)
  const localePrefix = beforeSlug.length ? `/${beforeSlug.join('/')}` : ''
  const rest = afterSlug.length ? `/${afterSlug.join('/')}` : ''
  const suffix = `${localePrefix}${rest}`
  return suffix || '/'
}

/**
 * Locale-aware storefront URL for QR codes and share links.
 * Primary locale uses unprefixed paths; secondary uses /{locale}/… when dual language is on.
 */
export function resolvePublicStoreUrlForLocale(
  slug: string,
  pub: StorePublicUrlMeta | null | undefined,
  config: {
    locale: SupportedLocale
    primary: SupportedLocale
    dualEnabled: boolean
    kind?: StorePublicPathKind
    query?: string
  },
): string {
  const cleanSlug = slug.replace(/^\/+/, '')
  const path = buildStorePublicPath(cleanSlug, {
    locale: config.locale,
    primary: config.primary,
    dualEnabled: config.dualEnabled,
    kind: config.kind ?? 'landing',
  })
  const query = config.query
    ? (config.query.startsWith('?') ? config.query : `?${config.query}`)
    : ''

  const domain = pub?.custom_domain?.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
  if (pub?.custom_domain_verified && domain) {
    const suffix = publicPathSuffixFromStorePath(path, cleanSlug)
    return `https://${domain}${suffix === '/' ? '' : suffix}${query}`
  }

  const base = isSplitDomainDeployment() ? getMarketingBaseUrl() : getAppBaseUrl()
  return `${base}${path}${query}`
}

/** Turn a template path like `/order` into a scannable absolute URL for QR codes. */
export function resolveQrCustomUrl(
  slug: string,
  pub: StorePublicUrlMeta | null | undefined,
  storeBaseUrl: string,
  customUrl: string,
): string {
  const trimmed = customUrl.trim()
  if (!trimmed) return storeBaseUrl
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return resolvePublicStoreUrl(slug, pub, path)
}

export function getAuthCallbackUrl(nextPath: string = '/dashboard'): string {
  return `${getAppBaseUrl()}/api/auth/callback?next=${encodeURIComponent(nextPath)}`
}

/** True when marketing and app are on different hostnames (production split). */
export function isSplitDomainDeployment(): boolean {
  return getMarketingHostname() !== getAppHostname()
}

export const MARKETING_PATH_PREFIXES = [
  '/pricing',
  '/features',
  '/contact',
  '/blog',
  '/explore',
] as const

export function isMarketingPath(pathname: string): boolean {
  if (pathname === '/') return true
  return MARKETING_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export const APP_PATH_PREFIXES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/dashboard',
  '/onboarding',
  '/business',
  '/invite',
  '/api/auth',
] as const

export function isAppOnlyPath(pathname: string): boolean {
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    return false
  }
  return APP_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

/** Public restaurant menu pages: /{slug} — not marketing, not app-only list routes */
export function isPublicSlugPath(pathname: string): boolean {
  if (pathname === '/' || isMarketingPath(pathname) || isAppOnlyPath(pathname)) {
    return false
  }
  const segment = pathname.split('/').filter(Boolean)[0]
  if (!segment) return false
  const reserved = new Set([
    'pricing',
    'features',
    'contact',
    'blog',
    'explore',
    'login',
    'signup',
    'dashboard',
    'onboarding',
    'business',
    'invite',
    'api',
    '_next',
  ])
  return !reserved.has(segment)
}
