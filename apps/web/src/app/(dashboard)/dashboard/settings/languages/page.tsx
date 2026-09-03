import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { getActiveBusiness } from '@/lib/business-server'
import { assertDashboardAccess } from '@/lib/assert-dashboard-access'
import { listBusinessLocalesAction, billLocalesIfDueAction } from '@/app/actions/business-locales'
import { LanguagesSettingsForm } from './LanguagesSettingsForm'
import { LOCALE_CREDITS_PER_MONTH } from '@/lib/credit-packs'
import { toStoreLocaleCode } from '@/i18n/store-locales'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Store Languages' }
export const dynamic = 'force-dynamic'

export default async function StoreLanguagesPage() {
  const { supabase, user } = await getAuthUser()
  if (!user) redirect('/login')

  const { business, role } = await getActiveBusiness(supabase, user.id)
  if (!business) redirect('/onboarding/new-business')
  assertDashboardAccess('/dashboard/settings/languages', role, 'settings')

  try {
    await billLocalesIfDueAction(business.id)
  } catch (error) {
    console.error('billLocalesIfDueAction on languages page:', error)
  }

  const listed = await listBusinessLocalesAction(business.id)
  if (!listed.success) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {listed.error}
      </div>
    )
  }

  const { data: balanceRow } = await supabase
    .from('credit_balances')
    .select('balance')
    .eq('business_id', business.id)
    .maybeSingle()

  const creditBalance = Number((balanceRow as { balance?: number } | null)?.balance ?? 0)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Store languages</h3>
        <p className="text-sm text-muted-foreground">
          Primary language is free. Extra languages are {LOCALE_CREDITS_PER_MONTH} credits per month
          and are edited in Translations — not in the page builder.
        </p>
      </div>

      <div className="bg-white border rounded-xl p-6">
        <LanguagesSettingsForm
          businessId={business.id}
          primaryLocale={toStoreLocaleCode(listed.data.primary)}
          locales={listed.data.locales}
          creditBalance={creditBalance}
        />
      </div>
    </div>
  )
}
