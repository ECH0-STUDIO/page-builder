import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditorShell } from '@/components/page-builder/EditorShell'
import { getPageDataAction } from '@/app/actions/page-builder'
import type { Metadata } from 'next'
import type { MenuCategory, MenuItem, VariantGroup, VariantOption } from '@/app/actions/menu'

export const metadata: Metadata = { title: 'Page Builder' }

// The page builder owns its own full-screen layout — no dashboard padding
export const dynamic = 'force-dynamic'

export default async function PagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // Get the active business (first-created, same as menu)
  // TODO: wire to BusinessContext / cookie-based switcher in Phase 9
  const { data: businesses } = await db
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  const business = businesses?.[0]
  if (!business) redirect('/onboarding/new-business')

  const [{ blocks, publishing, theme }, { data: categoriesRaw }, { data: itemsRaw }] = await Promise.all([
    getPageDataAction(business.id),
    db.from('menu_categories').select('*').eq('business_id', business.id).order('sort_order', { ascending: true }),
    db.from('menu_items').select('*').eq('business_id', business.id).order('sort_order', { ascending: true }),
  ])

  const categories: MenuCategory[] = categoriesRaw ?? []
  const items: MenuItem[] = itemsRaw ?? []

  // Fetch variants only if there are items (avoids redundant query)
  let variantGroups: VariantGroup[] = []
  let variantOptions: VariantOption[] = []
  if (items.length > 0) {
    const itemIds = items.map((i: MenuItem) => i.id)
    const { data: vGroups } = await db.from('menu_item_variant_groups').select('*').in('item_id', itemIds).order('sort_order')
    variantGroups = vGroups ?? []
    if (variantGroups.length > 0) {
      const groupIds = variantGroups.map((g: VariantGroup) => g.id)
      const { data: vOpts } = await db.from('menu_item_variant_options').select('*').in('group_id', groupIds).order('sort_order')
      variantOptions = vOpts ?? []
    }
  }

  return (
    <EditorShell
      business={business}
      initialBlocks={blocks}
      initialPublishing={publishing}
      initialTheme={theme}
      initialCategories={categories}
      initialItems={items}
      initialVariantGroups={variantGroups}
      initialVariantOptions={variantOptions}
    />
  )
}
