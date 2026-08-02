import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { getActiveBusiness } from '@/lib/business-server'
import { OrdersClient } from '@/components/orders/OrdersClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Live Orders' }
export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const { supabase, user } = await getAuthUser()
  if (!user) redirect('/login')

  const { business, role } = await getActiveBusiness(supabase, user.id)
  if (!business) redirect('/onboarding/new-business')
  return <OrdersClient businessId={business.id} role={role ?? 'staff'} />
}
