import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { getActiveBusiness } from '@/lib/business-server'
import { assertDashboardAccess } from '@/lib/assert-dashboard-access'
import { getPaymentSettingsAction } from '@/app/actions/payments'
import type { Metadata } from 'next'
import { VietQRSettings } from '@/components/payments/VietQRSettings'
import { PaymentPrintSection } from '@/components/payments/PaymentPrintSection'
import { getServerTranslation } from '@/i18n/getDictionary'

export const metadata: Metadata = { title: 'Payment Settings' }
export const dynamic = 'force-dynamic'

export default async function PaymentsPage() {
  const { supabase, user } = await getAuthUser()
  if (!user) redirect('/login')

  const { t } = await getServerTranslation()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase

  const { business, role } = await getActiveBusiness(supabase, user.id)
  if (!business) redirect('/onboarding/new-business')
  assertDashboardAccess('/dashboard/payments', role, 'nav')
  const paymentSettings = await getPaymentSettingsAction(business.id)

  const { data: pub } = await db
    .from('publishing_settings')
    .select('language, dual_language_enabled, dual_language_setup_status, enabled_locales')
    .eq('business_id', business.id)
    .maybeSingle()

  const { parseStoreLanguageConfig } = await import('@/i18n/store-locale')
  const storeLanguage = parseStoreLanguageConfig(pub)

  return (
    <div className="p-4 md:p-8 max-w-3xl space-y-12">

      {/* ── Bank Account Setup ── */}
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">{t('payments.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('payments.description')}
          </p>
        </div>
        <VietQRSettings
          businessId={business.id}
          initialSettings={paymentSettings}
          businessName={business.name}
        />
      </div>

      {/* ── Payment QR Print Designer ── */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground">{t('payments.printStand')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('payments.printStandDesc')}
          </p>
        </div>
        <PaymentPrintSection
          businessId={business.id}
          paymentSettings={paymentSettings}
          businessName={business.name}
          businessLogoUrl={business.logo_url ?? null}
          storeLanguage={storeLanguage}
        />
      </div>

    </div>
  )
}
