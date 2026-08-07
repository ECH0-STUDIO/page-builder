import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { getActiveBusiness } from '@/lib/business-server'
import { assertDashboardAccess } from '@/lib/assert-dashboard-access'
import { QRManager } from '@/components/qr/QRManager'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getServerTranslation } from '@/i18n/getDictionary'

export const metadata: Metadata = { title: 'QR Codes' }
export const dynamic = 'force-dynamic'

export default async function QRPage() {
  const { supabase, user } = await getAuthUser()
  if (!user) redirect('/login')

  const { t } = await getServerTranslation()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase

  const { business, role } = await getActiveBusiness(supabase, user.id)
  if (!business) redirect('/onboarding/new-business')
  assertDashboardAccess('/dashboard/qr', role, 'nav')
  if (!business.slug) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">
          {t('qr.noSlug')}{' '}
          <Link href="/dashboard/business" className="underline">{t('qr.businessSettings')}</Link>.
        </p>
      </div>
    )
  }

  const { data: publishingRaw } = await db
    .from('publishing_settings')
    .select('custom_domain, custom_domain_verified')
    .eq('business_id', business.id)
    .maybeSingle()

  const publishing = publishingRaw as {
    custom_domain?: string | null
    custom_domain_verified?: boolean | null
  } | null

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{t('sidebar.qrCodes')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('qr.description')}
        </p>
      </div>

      <QRManager
        businessId={business.id}
        paymentSettings={(business as { payment_settings?: Record<string, unknown> }).payment_settings ?? {}}
        slug={business.slug}
        businessName={business.name}
        businessLogoUrl={business.logo_url ?? null}
        storePub={{
          custom_domain: publishing?.custom_domain ?? null,
          custom_domain_verified: publishing?.custom_domain_verified === true,
        }}
      />
    </div>
  )
}
