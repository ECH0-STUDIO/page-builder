import { createClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/business-server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getServerTranslation } from '@/i18n/getDictionary'
import { DeleteBusinessSection } from './DeleteBusinessSection'

export const metadata: Metadata = { title: 'Business Settings' }

export default async function BusinessSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { business, role } = await getActiveBusiness(supabase, user.id)
  if (!business) redirect('/onboarding/new-business')

  const { t } = await getServerTranslation()
  const isOwner = role === 'owner'

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('settings.business.title')}</h3>
        <p className="text-sm text-muted-foreground">{t('settings.business.description')}</p>
      </div>

      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-destructive">{t('settings.business.dangerZone')}</h4>
          <p className="text-sm text-muted-foreground mt-1">{t('settings.business.dangerDescription')}</p>
        </div>
        <div className="rounded-lg border bg-background p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-medium">{business.name}</p>
            <p className="text-xs text-muted-foreground">/{business.slug}</p>
          </div>
          <DeleteBusinessSection
            businessId={business.id}
            businessName={business.name}
            isOwner={isOwner}
          />
        </div>
      </div>
    </div>
  )
}
