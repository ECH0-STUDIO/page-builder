import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/business-server'
import { getPublishingAction } from '@/app/actions/page-builder'
import type { Metadata } from 'next'
import { OrderPageEditor } from '@/components/order-page/OrderPageEditor'
import { getPublicStoreUrl } from '@/lib/site-urls'
import { normalizeMenuCategories, normalizeMenuItems } from '@/i18n/menu-content'
import { defaultThemeSettings } from '@/components/page-builder/types'

export const metadata: Metadata = { title: 'Order Page' }
export const dynamic = 'force-dynamic'

export default async function OrderPageAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = supabase

  const { business } = await getActiveBusiness(supabase, user.id)
  if (!business) redirect('/onboarding/new-business')

  const [{ publishing, slug }, { data: catsRaw }, { data: itemsRaw }, { data: themeRaw }] =
    await Promise.all([
      getPublishingAction(business.id),
      db.from('menu_categories').select('*').eq('business_id', business.id).order('sort_order', { ascending: true }),
      db.from('menu_items').select('*').eq('business_id', business.id).order('sort_order', { ascending: true }),
      db.from('theme_settings').select('*').eq('business_id', business.id).maybeSingle(),
    ])

  const categories = normalizeMenuCategories((catsRaw ?? []) as Record<string, unknown>[])
  const items = normalizeMenuItems((itemsRaw ?? []) as Record<string, unknown>[])
  const resolvedSlug = slug ?? business.slug
  const orderUrl = `${getPublicStoreUrl(resolvedSlug)}/order`
  const orderPath = `/${resolvedSlug}/order`
  const orderPublished =
    publishing?.order_published == null
      ? Boolean(publishing?.published)
      : Boolean(publishing.order_published)

  return (
    <OrderPageEditor
      businessId={business.id}
      businessName={business.name}
      logoUrl={business.logo_url}
      slug={resolvedSlug}
      orderUrl={orderUrl}
      orderPath={orderPath}
      orderPublished={orderPublished}
      publishing={publishing}
      initialTheme={themeRaw ?? defaultThemeSettings}
      categories={categories}
      items={items}
    />
  )
}
