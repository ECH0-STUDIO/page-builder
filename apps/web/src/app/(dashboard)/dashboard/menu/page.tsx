import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { getActiveBusiness } from '@/lib/business-server'
import { MenuBuilder } from '@/components/menu/MenuBuilder'
import { normalizeMenuCategories, normalizeMenuItems } from '@/i18n/menu-content'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Menu' }

export default async function MenuPage() {
  const { supabase, user } = await getAuthUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase

  const { business } = await getActiveBusiness(supabase, user.id)
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
      initialCategories={normalizeMenuCategories((categories ?? []) as Record<string, unknown>[])}
      initialItems={normalizeMenuItems((items ?? []) as Record<string, unknown>[])}
    />
  )
}
