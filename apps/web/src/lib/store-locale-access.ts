import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  isStoreLocaleCode,
  toStoreLocaleCode,
  type StoreLocaleCode,
} from '@/i18n/store-locales'

export type StoreLocaleAccess = {
  businessId: string
  slug: string
  primary: StoreLocaleCode
  activeExtra: StoreLocaleCode[]
}

/** Load primary + active purchased locales for a published store slug. */
export async function loadStoreLocaleAccess(slug: string): Promise<StoreLocaleAccess | null> {
  const supabase = await createClient()
  const { data: business } = await supabase
    .from('businesses')
    .select('id, slug')
    .eq('slug', slug)
    .maybeSingle()

  if (!business) return null

  const { data: pub } = await supabase
    .from('publishing_settings')
    .select('language, published')
    .eq('business_id', business.id)
    .maybeSingle()

  if (!pub?.published) return null

  const primary = toStoreLocaleCode((pub as { language?: string | null }).language)

  const admin = createAdminClient()
  const { data: rows } = await (admin as any)
    .from('business_locales')
    .select('locale')
    .eq('business_id', business.id)
    .eq('status', 'active')

  const activeExtra: StoreLocaleCode[] = []
  for (const row of (rows ?? []) as { locale?: string }[]) {
    if (isStoreLocaleCode(row.locale) && row.locale !== primary) {
      activeExtra.push(row.locale)
    }
  }

  return {
    businessId: business.id,
    slug: business.slug,
    primary,
    activeExtra,
  }
}

/** True when path locale may be served (purchased + active, not primary). */
export function isPurchasedPathLocale(
  access: StoreLocaleAccess,
  pathLocale: string,
): pathLocale is StoreLocaleCode {
  return isStoreLocaleCode(pathLocale) && access.activeExtra.includes(pathLocale)
}

export function allPublicLocales(access: StoreLocaleAccess): StoreLocaleCode[] {
  return [access.primary, ...access.activeExtra]
}
