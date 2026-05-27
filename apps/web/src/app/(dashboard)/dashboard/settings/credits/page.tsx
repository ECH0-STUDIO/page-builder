import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getActiveBusiness } from '@/lib/business-server'
import { CreditDashboard } from '@/components/dashboard/CreditDashboard'

export default async function CreditsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { business, role } = await getActiveBusiness(supabase, user.id)
  
  if (!business) {
    redirect('/onboarding/new-business')
  }

  // Double check role
  if (role === 'staff') {
    redirect('/dashboard') // Staff cannot access settings/credits
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Billing & Credits</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your business credits and view transaction history.
        </p>
      </div>

      <CreditDashboard businessId={business.id} />
    </div>
  )
}
