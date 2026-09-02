import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getAuthUser } from '@/lib/auth-server'
import { getActiveBusiness } from '@/lib/business-server'
import { assertDashboardAccess } from '@/lib/assert-dashboard-access'
import { getServerTranslation } from '@/i18n/getDictionary'
import { getStoreLanguageSettingsAction } from '@/app/actions/store-language'
import { LanguageSettingsForm } from './LanguageSettingsForm'

export const metadata: Metadata = { title: 'Store Language Settings' }

export default async function StoreLanguageSettingsPage() {
  const { supabase, user } = await getAuthUser()
  if (!user) redirect('/login')

  const { business, role } = await getActiveBusiness(supabase, user.id)
  const { t } = await getServerTranslation()

  if (!business) {
    redirect('/onboarding/new-business')
  }

  assertDashboardAccess('/dashboard/settings/language', role, 'settings')

  const settingsRes = await getStoreLanguageSettingsAction(business.id)
  if (!settingsRes.success) {
    return (
      <div className="text-sm text-destructive">
        {settingsRes.error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('settings.storeLanguage.title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('settings.storeLanguage.description')}
        </p>
      </div>

      <div className="bg-white border rounded-xl p-6">
        <LanguageSettingsForm businessId={business.id} initial={settingsRes.data} />
      </div>
    </div>
  )
}
