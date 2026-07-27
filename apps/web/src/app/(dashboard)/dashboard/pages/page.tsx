import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/business-server'
import { PuckEditorShell } from '@/components/page-builder/puck/PuckEditorShell'
import { OrderPageEditor } from '@/components/order-page/OrderPageEditor'
import { getPageDataAction, getPublishingAction } from '@/app/actions/page-builder'
import type { Metadata } from 'next'
import type { MenuCategory, MenuItem, VariantGroup, VariantOption } from '@/app/actions/menu'
import { normalizeMenuCategories, normalizeMenuItems } from '@/i18n/menu-content'
import { getPublicStoreUrl } from '@/lib/site-urls'
import { defaultThemeSettings } from '@/components/page-builder/types'
import type { BuilderPageMode } from '@/components/page-builder/PageBuilderModeSwitcher'

export const metadata: Metadata = { title: 'Page Builder' }

// The page builder owns its own full-screen layout — no dashboard padding
export const dynamic = 'force-dynamic'

function resolveMode(raw: string | string[] | undefined): BuilderPageMode {
  const value = Array.isArray(raw) ? raw[0] : raw
  return value === 'order' ? 'order' : 'landing'
}

export default async function PagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = supabase
  const mode = resolveMode((await searchParams).page)

  const { business } = await getActiveBusiness(supabase, user.id)
  if (!business) redirect('/onboarding/new-business')

  const [
    { blocks, publishing: landingPublishing, theme },
    { publishing: orderPublishing, slug },
    { data: categoriesRaw },
    { data: itemsRaw },
  ] = await Promise.all([
    getPageDataAction(business.id),
    getPublishingAction(business.id),
    db.from('menu_categories').select('*').eq('business_id', business.id).order('sort_order', { ascending: true }),
    db.from('menu_items').select('*').eq('business_id', business.id).order('sort_order', { ascending: true }),
  ])

  const categories = normalizeMenuCategories((categoriesRaw ?? []) as Record<string, unknown>[])
  const items = normalizeMenuItems((itemsRaw ?? []) as Record<string, unknown>[])
  const publishing = landingPublishing ?? orderPublishing

  // Variants only needed for landing menu interactivity
  let variantGroups: VariantGroup[] = []
  let variantOptions: VariantOption[] = []
  if (mode === 'landing' && items.length > 0) {
    const itemIds = items.map((i: MenuItem) => i.id)
    const { data: vGroups } = await db.from('menu_item_variant_groups').select('*').in('item_id', itemIds).order('sort_order')
    variantGroups = vGroups ?? []
    if (variantGroups.length > 0) {
      const groupIds = variantGroups.map((g: VariantGroup) => g.id)
      const { data: vOpts } = await db.from('menu_item_variant_options').select('*').in('group_id', groupIds).order('sort_order')
      variantOptions = vOpts ?? []
    }
  }

  if (mode === 'order') {
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
        initialTheme={theme ?? defaultThemeSettings}
        categories={categories}
        items={items}
        builderMode="order"
      />
    )
  }

  return (
    <PuckEditorShell
      business={business}
      initialBlocks={blocks}
      initialPublishing={publishing}
      initialTheme={theme}
      initialCategories={categories}
      initialItems={items}
      initialVariantGroups={variantGroups}
      initialVariantOptions={variantOptions}
      builderMode="landing"
    />
  )
}
