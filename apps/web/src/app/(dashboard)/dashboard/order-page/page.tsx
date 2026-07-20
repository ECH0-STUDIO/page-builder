import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/business-server'
import { getPublishingAction } from '@/app/actions/page-builder'
import type { Metadata } from 'next'
import { OrderPageEditor } from '@/components/order-page/OrderPageEditor'
import { getAppBaseUrl, getMarketingBaseUrl, getPublicStoreUrl, isSplitDomainDeployment } from '@/lib/site-urls'
import { getServerTranslation } from '@/i18n/getDictionary'
import { normalizeMenuCategories, normalizeMenuItems } from '@/i18n/menu-content'

export const metadata: Metadata = { title: 'Order Page' }
export const dynamic = 'force-dynamic'

export default async function OrderPageAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { t } = await getServerTranslation()
  const db = supabase

  const { business } = await getActiveBusiness(supabase, user.id)
  if (!business) redirect('/onboarding/new-business')

  const [{ publishing, slug }, { data: catsRaw }, { data: itemsRaw }] = await Promise.all([
    getPublishingAction(business.id),
    db.from('menu_categories').select('*').eq('business_id', business.id).order('sort_order', { ascending: true }),
    db.from('menu_items').select('*').eq('business_id', business.id).order('sort_order', { ascending: true }),
  ])

  const categories = normalizeMenuCategories((catsRaw ?? []) as Record<string, unknown>[])
  const items = normalizeMenuItems((itemsRaw ?? []) as Record<string, unknown>[])
  const resolvedSlug = slug ?? business.slug
  const orderUrl = `${getPublicStoreUrl(resolvedSlug)}/order`
  const orderPublished =
    publishing?.order_published == null
      ? Boolean(publishing?.published)
      : Boolean(publishing.order_published)

  // Keep siteOrigin referenced for future preview embeds
  void (isSplitDomainDeployment() ? getMarketingBaseUrl() : getAppBaseUrl())

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{t('orderPageAdmin.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('orderPageAdmin.description')}
        </p>
      </div>

      <OrderPageEditor
        businessId={business.id}
        slug={resolvedSlug}
        orderUrl={orderUrl}
        orderPublished={orderPublished}
        publishing={publishing}
        categories={categories}
        items={items}
      />
    </div>
  )
}
