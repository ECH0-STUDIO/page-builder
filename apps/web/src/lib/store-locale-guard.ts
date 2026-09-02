import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { SupportedLocale } from '@/i18n/locale'
import { isSupportedLocale } from '@/i18n/locale'
import {
  languageConfigFromPublishing,
  resolveStorePathLocale,
  shouldRedirectPrimaryPrefixedUrl,
  shouldRedirectSecondaryWhenDualOff,
  storePublicPathForLocale,
} from '@/lib/store-routing'

export interface StoreLocaleGuardResult {
  slug: string
  pathLocale: SupportedLocale
  languageConfig: ReturnType<typeof languageConfigFromPublishing>
}

/**
 * Validate /{locale}/{slug} routes and return redirect targets when needed.
 * Returns null when the caller should render the page.
 */
export async function guardPrefixedStoreRoute(
  locale: string,
  slug: string,
  kind: 'landing' | 'order' = 'landing',
): Promise<{ redirect: string } | StoreLocaleGuardResult> {
  if (!isSupportedLocale(locale)) notFound()

  const supabase = await createClient()
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!business) notFound()

  const { data: pub } = await supabase
    .from('publishing_settings')
    .select('language, dual_language_enabled, dual_language_setup_status, enabled_locales, published, order_published')
    .eq('business_id', business.id)
    .single()

  if (!pub?.published) notFound()

  const languageConfig = languageConfigFromPublishing(pub)

  if (shouldRedirectSecondaryWhenDualOff(locale, languageConfig)) {
    return {
      redirect: storePublicPathForLocale(slug, languageConfig, kind),
    }
  }

  const pathLocale = resolveStorePathLocale(locale, languageConfig)
  if (!pathLocale) notFound()

  if (shouldRedirectPrimaryPrefixedUrl(pathLocale, languageConfig)) {
    return {
      redirect: storePublicPathForLocale(slug, languageConfig, kind),
    }
  }

  return { slug, pathLocale, languageConfig }
}

export async function runStoreLocaleGuard(
  locale: string,
  slug: string,
  kind: 'landing' | 'order' = 'landing',
): Promise<StoreLocaleGuardResult> {
  const result = await guardPrefixedStoreRoute(locale, slug, kind)
  if ('redirect' in result) {
    redirect(result.redirect)
  }
  return result
}
