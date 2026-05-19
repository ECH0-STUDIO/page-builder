import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/business-server'
// import { createClient } from '@/lib/supabase/server'
import { MenuBuilder } from '@/components/menu/MenuBuilder'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Menu' }

export default async function MenuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase

  const { data: businesses } = await db
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  const business = businesses?.[0]
  if (!business) redirect('/onboarding/new-business')

  const [{ data: categories }, { data: items }] = await Promise.all([
    db.from('menu_categories')
      .select('*')
      .eq('business_id', business.id)
      .order('sort_order', { ascending: true }),
    db.from('menu_items')
      .select('*')
      .eq('business_id', business.id)
      .order('sort_order', { ascending: true }),
  ])

  return (
    <MenuBuilder
      businessId={business.id}
      initialCategories={categories ?? []}
      initialItems={items ?? []}
    />
  )
}
