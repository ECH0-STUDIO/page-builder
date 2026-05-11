import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BusinessProfileForm } from '@/components/business/BusinessProfileForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Business Profile' }

export default async function BusinessProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get current business — we read from the first one for now
  // (context switching happens client-side, SSR always gets the first)
  const { data: businesses } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  const business = businesses?.[0]
  if (!business) redirect('/onboarding/new-business')

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Business Profile</h1>
        <p className="text-muted-foreground mt-1">
          This information appears on your public page and in the directory.
        </p>
      </div>

      <BusinessProfileForm business={business} />
    </div>
  )
}
