import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { getActiveBusiness } from '@/lib/business-server'
import { assertDashboardAccess } from '@/lib/assert-dashboard-access'
import { BusinessProfileForm } from '@/components/business/BusinessProfileForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Business Profile' }

export default async function BusinessProfilePage() {
  const { supabase, user } = await getAuthUser()
  if (!user) redirect('/login')

  // Get current business — we read from the first one for now
  // (context switching happens client-side, SSR always gets the first)
  const { business, role } = await getActiveBusiness(supabase, user.id)
  if (!business) redirect('/onboarding/new-business')
  assertDashboardAccess('/dashboard/business', role, 'nav')

  return (
    <div className="p-4 md:p-8 pb-12 md:pb-16 max-w-3xl">
      <BusinessProfileForm business={business} />
    </div>
  )
}
