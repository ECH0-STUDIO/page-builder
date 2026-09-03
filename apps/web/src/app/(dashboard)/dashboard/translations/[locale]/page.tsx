import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { getActiveBusiness } from '@/lib/business-server'
import { assertDashboardAccess } from '@/lib/assert-dashboard-access'
import { isStoreLocaleCode, storeLocaleLabel } from '@/i18n/store-locales'
import { getTranslationBundleAction } from '@/app/actions/translations'
import { TranslationEditor } from '@/components/translations/TranslationEditor'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isStoreLocaleCode(locale)) return { title: 'Translations' }
  return { title: `Translate · ${storeLocaleLabel(locale)}` }
}

export default async function TranslationLocalePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const { supabase, user } = await getAuthUser()
  if (!user) redirect('/login')

  const { business, role } = await getActiveBusiness(supabase, user.id)
  if (!business) redirect('/onboarding/new-business')
  assertDashboardAccess('/dashboard/translations', role, 'nav')

  if (!isStoreLocaleCode(locale)) {
    redirect('/dashboard/translations')
  }

  const bundle = await getTranslationBundleAction(business.id, locale)
  if (!bundle.success) {
    if (bundle.error.includes('Activate')) {
      redirect('/dashboard/settings/languages')
    }
    if (bundle.error.includes('Primary')) {
      redirect('/dashboard/translations')
    }
    return (
      <div className="p-4 md:p-8">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {bundle.error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <TranslationEditor
        businessId={business.id}
        locale={bundle.data.locale}
        primary={bundle.data.primary}
        initialFields={bundle.data.fields}
      />
    </div>
  )
}
