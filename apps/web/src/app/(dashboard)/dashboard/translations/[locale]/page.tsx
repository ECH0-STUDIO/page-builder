import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-server'
import { getActiveBusiness } from '@/lib/business-server'
import { assertDashboardAccess } from '@/lib/assert-dashboard-access'
import { isStoreLocaleCode, storeLocaleLabel } from '@/i18n/store-locales'
import { getActiveBusinessLocales, getBusinessPrimaryLocale } from '@/app/actions/business-locales'

export const dynamic = 'force-dynamic'

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

  const primary = await getBusinessPrimaryLocale(business.id)
  if (locale === primary) {
    redirect('/dashboard/translations')
  }

  const active = await getActiveBusinessLocales(business.id)
  if (!active.includes(locale)) {
    redirect('/dashboard/settings/languages')
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">
        Translate to {storeLocaleLabel(locale)}
      </h1>
      <p className="text-sm text-muted-foreground">
        The full translation checklist (page, menu, order, SEO) ships next. Your {storeLocaleLabel(locale)}{' '}
        storefront is already live at <code className="text-foreground">/{locale}/…</code> and shows
        primary-language content until you add translations.
      </p>
      <Link
        href="/dashboard/settings/languages"
        className="text-sm underline underline-offset-2"
      >
        Back to store languages
      </Link>
    </div>
  )
}
