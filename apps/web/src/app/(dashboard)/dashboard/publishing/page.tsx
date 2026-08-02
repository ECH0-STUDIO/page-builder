import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { getActiveBusiness } from '@/lib/business-server'
import { getPublishingAction, getPageViewsAction, getCustomDomainSetupAction } from '@/app/actions/page-builder'
import { billCustomDomainIfDueAction, billPageViewsIfDueAction } from '@/app/actions/credits'
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

  const { business } = await getActiveBusiness(supabase, user.id)
  if (!business) redirect('/onboarding/new-business')

  // Opportunistic billing while owner is on Publishing (no cron needed)
  await Promise.all([
    billCustomDomainIfDueAction(business.id),
    billPageViewsIfDueAction(business.id),
  ])

  const [{ publishing, slug }, analytics, domainSetup] = await Promise.all([
    getPublishingAction(business.id),
    getPageViewsAction(business.id, 7),
    getCustomDomainSetupAction(business.id),
  ])

  const siteOrigin = isSplitDomainDeployment() ? getMarketingBaseUrl() : getAppBaseUrl()

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
        initialDomainSetup={domainSetup}
      />
    </div>
  )
}
