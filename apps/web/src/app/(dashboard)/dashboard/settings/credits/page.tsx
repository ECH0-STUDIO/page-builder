import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getActiveBusiness } from '@/lib/business-server'
import { CreditDashboard } from '@/components/dashboard/CreditDashboard'
import { getServerTranslation } from '@/i18n/getDictionary'

export default async function CreditsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { business, role } = await getActiveBusiness(supabase, user.id)
  const { t } = await getServerTranslation()
  
  if (!business) {
    redirect('/onboarding/new-business')
  }

  if (role === 'staff') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{t('settings.tabs.credits')}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('credits.pageDescription')}
        </p>
      </div>

      <CreditDashboard businessId={business.id} />
    </div>
  )
}
