import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Languages } from 'lucide-react'
import { getAuthUser } from '@/lib/auth-server'
import { getActiveBusiness } from '@/lib/business-server'
import { assertDashboardAccess } from '@/lib/assert-dashboard-access'
import { listBusinessLocalesAction } from '@/app/actions/business-locales'
import { storeLocaleLabel, STORE_LOCALE_CATALOG } from '@/i18n/store-locales'
import { LOCALE_CREDITS_PER_MONTH } from '@/lib/credit-packs'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Translations' }
export const dynamic = 'force-dynamic'

export default async function TranslationsIndexPage() {
  const { supabase, user } = await getAuthUser()
  if (!user) redirect('/login')

  const { business, role } = await getActiveBusiness(supabase, user.id)
  if (!business) redirect('/onboarding/new-business')
  assertDashboardAccess('/dashboard/translations', role, 'nav')

  const listed = await listBusinessLocalesAction(business.id)
  const active = listed.success
    ? listed.data.locales.filter(l => l.status === 'active')
    : []
  const primary = listed.success ? listed.data.primary : 'vi'

  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-muted flex items-center justify-center">
          <Languages className="size-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Translations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Fill guest-facing copy for each purchased language. Primary (
            {storeLocaleLabel(primary)}) is edited in the page builder and menu.
          </p>
        </div>
      </div>

      {active.length === 0 ? (
        <div className="rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground space-y-3">
          <p>No extra languages yet.</p>
          <p>
            Add English, Deutsch, and more under{' '}
            <Link href="/dashboard/settings/languages" className="underline underline-offset-2 text-foreground">
              Settings → Store languages
            </Link>{' '}
            ({LOCALE_CREDITS_PER_MONTH} credits/month each).
          </p>
        </div>
      ) : (
        <div className="rounded-xl border divide-y">
          {active.map(row => {
            const meta = STORE_LOCALE_CATALOG[row.locale]
            return (
              <Link
                key={row.id}
                href={`/dashboard/translations/${row.locale}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{meta.label}</p>
                  <p className="text-xs text-muted-foreground">{meta.labelEn} · /{row.locale}/…</p>
                </div>
                <span className="text-xs font-medium text-muted-foreground">Edit →</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
