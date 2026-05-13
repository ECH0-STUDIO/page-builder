import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/business-server'
// import { createClient } from '@/lib/supabase/server'
import { BusinessProfileForm } from '@/components/business/BusinessProfileForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Business Profile' }

export default async function BusinessProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get current business — we read from the first one for now
  // (context switching happens client-side, SSR always gets the first)
  const { business } = await getActiveBusiness(supabase, user.id)
  if (!business) redirect('/onboarding/new-business')

  return (
    <div className="p-8 max-w-3xl">
      <BusinessProfileForm business={business} />
    </div>
  )
}
