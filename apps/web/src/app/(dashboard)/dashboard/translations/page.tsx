import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Languages } from 'lucide-react'
import { getAuthUser } from '@/lib/auth-server'
import { getActiveBusiness } from '@/lib/business-server'
import { assertDashboardAccess } from '@/lib/assert-dashboard-access'
import { listBusinessLocalesAction } from '@/app/actions/business-locales'
import { getTranslationProgressAction } from '@/app/actions/translations'
import {
  storeLocaleLabel,
  storeLocaleSecondaryLabel,
  STORE_LOCALE_CATALOG,
} from '@/i18n/store-locales'
import { LOCALE_CREDITS_PER_MONTH } from '@/lib/credit-packs'
import { getTranslationProgressSections } from '@/lib/translation-fields'
import { getServerTranslation } from '@/i18n/getDictionary'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation()
  return { title: t('translations.title') }
}

export default async function TranslationsIndexPage() {
  const { supabase, user } = await getAuthUser()
  if (!user) redirect('/login')

  const { t } = await getServerTranslation()
  const { business, role } = await getActiveBusiness(supabase, user.id)
  if (!business) redirect('/onboarding/new-business')
  assertDashboardAccess('/dashboard/translations', role, 'nav')

  const listed = await listBusinessLocalesAction(business.id)
  const active = listed.success
    ? listed.data.locales.filter(l => l.status === 'active')
    : []
  const primary = listed.success ? listed.data.primary : 'vi'

  const progressRes = active.length
    ? await getTranslationProgressAction(business.id, active.map(r => r.locale))
    : { success: true as const, data: {} as Record<string, never> }
  const progress = progressRes.success ? progressRes.data : {}

  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-muted flex items-center justify-center">
          <Languages className="size-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('translations.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('translations.description').replace('{{primary}}', storeLocaleLabel(primary))}
          </p>
        </div>
      </div>

      {active.length === 0 ? (
        <div className="rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground space-y-3">
          <p>{t('translations.emptyTitle')}</p>
          <p>
            {t('translations.emptyHint').replace('{{credits}}', String(LOCALE_CREDITS_PER_MONTH))}{' '}
            (
            <Link
              href="/dashboard/settings/languages"
              className="underline underline-offset-2 text-foreground"
            >
              {t('translations.settingsLink')}
            </Link>
            ).
          </p>
        </div>
      ) : (
        <div className="rounded-xl border divide-y">
          {active.map(row => {
            const meta = STORE_LOCALE_CATALOG[row.locale]
            const secondary = storeLocaleSecondaryLabel(row.locale)
            const prog = progress[row.locale]
            const sections = prog && prog.total > 0 ? getTranslationProgressSections(prog) : []
            const summary =
              prog && prog.total > 0
                ? t('translations.progressSummary')
                    .replace('{{translated}}', String(prog.translated))
                    .replace('{{total}}', String(prog.total))
                : null
            return (
              <Link
                key={row.id}
                href={`/dashboard/translations/${row.locale}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{meta.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {secondary ? `${secondary} · ` : ''}
                    /{row.locale}/…
                    {summary ? (
                      <span className="ml-2 text-foreground/80">
                        {summary}
                        {sections.length > 0 ? (
                          <span className="text-muted-foreground">
                            {' '}
                            ·{' '}
                            {sections
                              .slice(0, 3)
                              .map(
                                s =>
                                  `${t(`translations.sectionShort.${s.id}`)} ${s.translated}/${s.total}`,
                              )
                              .join(' · ')}
                            {sections.length > 3 ? ' · …' : ''}
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                  </p>
                </div>
                <span className="text-xs font-medium text-muted-foreground shrink-0">
                  {t('translations.edit')}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
