import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { getActiveBusiness } from '@/lib/business-server'
import { assertDashboardAccess } from '@/lib/assert-dashboard-access'
import { getPublishingAction, getPageViewsAction, getCustomDomainSetupAction } from '@/app/actions/page-builder'
import { billCustomDomainIfDueAction, billPageViewsIfDueAction, refundPendingCustomDomainCharges } from '@/app/actions/credits'
import { billLocalesIfDueAction } from '@/app/actions/business-locales'
import type { Metadata } from 'next'
import { PublishingClient } from '@/components/publishing/PublishingClient'
import { getAppBaseUrl, getMarketingBaseUrl, isSplitDomainDeployment } from '@/lib/site-urls'
import { getServerTranslation } from '@/i18n/getDictionary'

export const metadata: Metadata = { title: 'Publishing' }
export const dynamic = 'force-dynamic'

export default async function PublishingPage() {
  const { supabase, user } = await getAuthUser()
  if (!user) redirect('/login')

  const { t } = await getServerTranslation()

  const { business, role } = await getActiveBusiness(supabase, user.id)
  if (!business) redirect('/onboarding/new-business')
  assertDashboardAccess('/dashboard/publishing', role, 'nav')

  // Opportunistic billing / refund while owner is on Publishing (no cron needed).
  // Must not throw — failures here previously crashed the whole page.
  let refundedCredits = 0
  try {
    const refund = await refundPendingCustomDomainCharges(business.id)
    if (refund.refunded) refundedCredits += refund.amount
  } catch (error) {
    console.error('Publishing page refund error:', error)
  }
  try {
    await Promise.all([
      billCustomDomainIfDueAction(business.id),
      billPageViewsIfDueAction(business.id),
      billLocalesIfDueAction(business.id),
    ])
  } catch (error) {
    console.error('Publishing page billing error:', error)
  }

  const [{ publishing, slug }, analytics, domainSetup] = await Promise.all([
    getPublishingAction(business.id),
    getPageViewsAction(business.id, 7),
    getCustomDomainSetupAction(business.id).catch((error) => {
      console.error('Publishing page domain setup error:', error)
      return { domain: null, verified: false, dnsRecords: [], refundedCredits: 0 }
    }),
  ])

  const siteOrigin = isSplitDomainDeployment() ? getMarketingBaseUrl() : getAppBaseUrl()
  const setupWithRefund = {
    ...domainSetup,
    refundedCredits: (domainSetup.refundedCredits ?? 0) + refundedCredits,
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{t('publishing.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('publishing.description')}
        </p>
      </div>

      <PublishingClient
        businessId={business.id}
        publishing={publishing}
        slug={slug ?? business.id}
        analytics={analytics}
        baseUrl={siteOrigin}
        initialDomainSetup={setupWithRefund}
      />
    </div>
  )
}
