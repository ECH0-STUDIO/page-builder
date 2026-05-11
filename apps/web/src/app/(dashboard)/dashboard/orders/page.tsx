import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrdersClient } from '@/components/orders/OrdersClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Live Orders' }
export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: businesses } = await db
    .from('businesses')
    .select('id, slug, name')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  const business = businesses?.[0]
  if (!business) redirect('/onboarding/new-business')

  return <OrdersClient businessId={business.id} />
}
