import type { SupportedLocale } from '@/i18n/locale'
import { isSupportedLocale, toSupportedLocale } from '@/i18n/locale'
import { otherStoreLocale } from '@/i18n/localized-content'

export type DualLanguageSetupStatus = 'idle' | 'running' | 'ready' | 'failed'

export interface StoreLanguageConfig {
  dual_language_enabled: boolean
  dual_language_setup_status: DualLanguageSetupStatus
  /** Primary locale — stored as publishing_settings.language */
  primary_locale: SupportedLocale
  secondary_locale: SupportedLocale
  enabled_locales: SupportedLocale[]
}

export function parseStoreLanguageConfig(row: {
  language?: string | null
  dual_language_enabled?: boolean | null
  dual_language_setup_status?: string | null
  enabled_locales?: string[] | null
} | null | undefined): StoreLanguageConfig {
  const primary = toSupportedLocale(row?.language)
  const secondary = otherStoreLocale(primary)
  const dual = Boolean(row?.dual_language_enabled)
  const statusRaw = row?.dual_language_setup_status
  const setupStatus: DualLanguageSetupStatus =
    statusRaw === 'running' || statusRaw === 'ready' || statusRaw === 'failed'
      ? statusRaw
      : 'idle'

  let enabled: SupportedLocale[] = [primary]
  if (dual) {
    enabled = [primary, secondary]
  } else if (Array.isArray(row?.enabled_locales)) {
    enabled = row.enabled_locales.filter(isSupportedLocale)
    if (enabled.length === 0) enabled = [primary]
  }

  return {
    dual_language_enabled: dual,
    dual_language_setup_status: setupStatus,
    primary_locale: primary,
    secondary_locale: secondary,
    enabled_locales: enabled,
  }
}

/** Locale prefix for secondary URLs: /en/{slug} or /vi/{slug} */
export function secondaryLocalePathSegment(primary: SupportedLocale): 'vi' | 'en' {
  return primary === 'vi' ? 'en' : 'vi'
}

export type StorePublicPathKind = 'landing' | 'order'

/**
 * Public storefront path.
 * Primary: /{slug} or /{slug}/order
 * Secondary (dual on): /{locale}/{slug} or /{locale}/{slug}/order
 */
export function buildStorePublicPath(
  slug: string,
  options: {
    locale: SupportedLocale
    primary: SupportedLocale
    dualEnabled: boolean
    kind?: StorePublicPathKind
  },
): string {
  const kind = options.kind ?? 'landing'
  const suffix = kind === 'order' ? '/order' : ''
  const usePrefix =
    options.dualEnabled && options.locale !== options.primary
  if (usePrefix) {
    return `/${options.locale}/${slug}${suffix}`
  }
  return `/${slug}${suffix}`
}

/** Example paths for settings UI copy. */
export function exampleStorePublicPaths(primary: SupportedLocale, dualEnabled: boolean) {
  const slug = '{slug}'
  const secondary = otherStoreLocale(primary)
  return {
    primaryLanding: buildStorePublicPath(slug, {
      locale: primary,
      primary,
      dualEnabled,
      kind: 'landing',
    }),
    secondaryLanding: dualEnabled
      ? buildStorePublicPath(slug, {
          locale: secondary,
          primary,
          dualEnabled: true,
          kind: 'landing',
        })
      : null,
    primaryOrder: buildStorePublicPath(slug, {
      locale: primary,
      primary,
      dualEnabled,
      kind: 'order',
    }),
    secondaryOrder: dualEnabled
      ? buildStorePublicPath(slug, {
          locale: secondary,
          primary,
          dualEnabled: true,
          kind: 'order',
        })
      : null,
  }
}

/**
 * Parse locale from pathname segments when dual language uses a prefix.
 * /en/my-cafe → en; /my-cafe → null (primary); /en/my-cafe/order → en
 */
export function parseStorePathLocale(
  segments: string[],
  primary: SupportedLocale,
): SupportedLocale | null {
  const first = segments[0]
  if (first === 'en' || first === 'vi') {
    const secondary = otherStoreLocale(primary)
    if (first === secondary) return secondary
    if (first === primary && primary !== secondary) return primary
  }
  return null
}

export function enabledLocalesForPrimary(
  primary: SupportedLocale,
  dualEnabled: boolean,
): SupportedLocale[] {
  if (!dualEnabled) return [primary]
  return [primary, otherStoreLocale(primary)]
}
