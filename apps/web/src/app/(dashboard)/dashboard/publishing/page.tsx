import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/business-server'
// import { createClient } from '@/lib/supabase/server'
import { getPublishingAction, getPageViewsAction, getCustomDomainSetupAction } from '@/app/actions/page-builder'
import type { Metadata } from 'next'
import { PublishingClient } from '@/components/publishing/PublishingClient'
import { getPublicStoreUrl } from '@/lib/site-urls'
import { getServerTranslation } from '@/i18n/getDictionary'

export const metadata: Metadata = { title: 'Publishing' }
export const dynamic = 'force-dynamic'

export default async function PublishingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { t } = await getServerTranslation()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase

  const { business } = await getActiveBusiness(supabase, user.id)
  if (!business) redirect('/onboarding/new-business')
  const [{ publishing, slug }, analytics, domainSetup] = await Promise.all([
    getPublishingAction(business.id),
    getPageViewsAction(business.id, 7),
    getCustomDomainSetupAction(business.id),
  ])

  const baseUrl = slug ? getPublicStoreUrl(slug) : getPublicStoreUrl(business.slug ?? business.id)

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
        baseUrl={baseUrl}
        initialDomainSetup={domainSetup}
      />
    </div>
  )
}
