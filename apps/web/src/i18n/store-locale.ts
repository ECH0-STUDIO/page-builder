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

/** Path segment for secondary locale, e.g. /{slug}/en */
export function secondaryLocalePathSegment(primary: SupportedLocale): 'vi' | 'en' {
  return primary === 'vi' ? 'en' : 'vi'
}

/** Whether a storefront path includes an explicit locale segment. */
export function parseStorePathLocale(
  segments: string[],
  primary: SupportedLocale,
): SupportedLocale | null {
  const secondary = otherStoreLocale(primary)
  const last = segments[segments.length - 1]
  if (last === secondary) return secondary
  if (last === primary && last !== secondary) {
    // /vi when primary is vi would be ambiguous — treat as primary only when primary is vi and path ends with /vi
    if (primary === 'vi' && last === 'vi') return 'vi'
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
