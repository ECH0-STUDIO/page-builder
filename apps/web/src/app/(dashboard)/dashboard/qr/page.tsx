import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/business-server'
// import { createClient } from '@/lib/supabase/server'
import { QRManager } from '@/components/qr/QRManager'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { MenuCategory, MenuItem } from '@/app/actions/menu'
import { getServerTranslation } from '@/i18n/getDictionary'

export const metadata: Metadata = { title: 'QR Codes' }
export const dynamic = 'force-dynamic'

export default async function QRPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { t } = await getServerTranslation()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase

  const { data: businesses } = await db
    .from('businesses')
    .select('id, slug, name, logo_url')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  const business = businesses?.[0]
  if (!business) redirect('/onboarding/new-business')

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

  const [{ data: categoriesRaw }, { data: itemsRaw }] = await Promise.all([
    db.from('menu_categories').select('*').eq('business_id', business.id).order('sort_order'),
    db.from('menu_items').select('*').eq('business_id', business.id).order('sort_order'),
  ])

  const categories: MenuCategory[] = categoriesRaw ?? []
  const items: MenuItem[] = itemsRaw ?? []

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{t('sidebar.qrCodes')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('qr.description')}
        </p>
      </div>

      <QRManager
        businessId={business.id}
        paymentSettings={(business as any).payment_settings ?? {}}
        slug={business.slug}
        categories={categories}
        items={items}
        businessName={business.name}
        businessLogoUrl={business.logo_url ?? null}
      />
    </div>
  )
}
