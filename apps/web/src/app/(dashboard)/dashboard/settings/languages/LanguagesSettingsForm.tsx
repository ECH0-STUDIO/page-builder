'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, ChevronDown, Loader2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LOCALE_CREDITS_PER_MONTH } from '@/lib/credit-packs'
import {
  STORE_LOCALE_CATALOG,
  STORE_LOCALE_CODES,
  storeLocaleLabel,
  storeLocaleSecondaryLabel,
  type StoreLocaleCode,
} from '@/i18n/store-locales'
import type { BusinessLocaleRow } from '@/app/actions/business-locales'
import {
  cancelLocaleAction,
  purchaseLocaleAction,
  updatePrimaryLocaleAction,
} from '@/app/actions/business-locales'
import { getTranslationProgressAction } from '@/app/actions/translations'
import {
  getTranslationProgressSections,
  type TranslationProgress,
  type TranslationSectionId,
} from '@/lib/translation-fields'
import { useCreditBalance, useSyncCreditBalance } from '@/lib/react-query/hooks/useCredits'
import { useTranslation } from '@/i18n/I18nProvider'
import { cn } from '@/lib/utils'

function LocaleName({
  code,
  emphasize,
}: {
  code: StoreLocaleCode
  emphasize?: 'primary' | 'muted'
}) {
  const meta = STORE_LOCALE_CATALOG[code]
  const secondary = storeLocaleSecondaryLabel(code)
  return (
    <span>
      <span className="font-medium">{meta.label}</span>
      {secondary ? (
        <span
          className={cn(
            'ml-2 text-xs font-normal',
            emphasize === 'primary' ? 'text-background/70' : 'text-muted-foreground',
          )}
        >
          {secondary}
        </span>
      ) : null}
    </span>
  )
}

function ProgressLine({
  progress,
  t,
}: {
  progress: TranslationProgress
  t: (key: string) => string
}) {
  if (progress.total <= 0) return null
  const summary = t('translations.progressSummary')
    .replace('{{translated}}', String(progress.translated))
    .replace('{{total}}', String(progress.total))
  const sections = getTranslationProgressSections(progress)
  return (
    <span className="text-foreground/80">
      {summary}
      {sections.length > 0 ? (
        <span className="text-muted-foreground">
          {' '}
          ·{' '}
          {sections
            .slice(0, 3)
            .map(s => `${t(`translations.sectionShort.${s.id as TranslationSectionId}`)} ${s.translated}/${s.total}`)
            .join(' · ')}
          {sections.length > 3 ? ' · …' : ''}
        </span>
      ) : null}
    </span>
  )
}

export function LanguagesSettingsForm({
  businessId,
  primaryLocale: initialPrimary,
  locales: initialLocales,
  creditBalance: initialCreditBalance,
}: {
  businessId: string
  primaryLocale: StoreLocaleCode
  locales: BusinessLocaleRow[]
  creditBalance: number
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyLocale, setBusyLocale] = useState<string | null>(null)
  const [progress, setProgress] = useState<Record<string, TranslationProgress>>({})
  const [locales, setLocales] = useState(initialLocales)
  const [primaryLocale, setPrimaryLocale] = useState(initialPrimary)
  const [changePrimaryOpen, setChangePrimaryOpen] = useState(false)
  const { data: liveBalance = initialCreditBalance } = useCreditBalance(businessId, initialCreditBalance)
  const syncCredits = useSyncCreditBalance()

  useEffect(() => {
    setLocales(initialLocales)
  }, [initialLocales])

  useEffect(() => {
    setPrimaryLocale(initialPrimary)
  }, [initialPrimary])

  const activeExtra = useMemo(
    () => new Set(locales.filter(l => l.status === 'active').map(l => l.locale)),
    [locales],
  )
  const pastDue = useMemo(
    () => new Set(locales.filter(l => l.status === 'past_due').map(l => l.locale)),
    [locales],
  )

  const activeCodes = useMemo(
    () => locales.filter(l => l.status === 'active').map(l => l.locale).sort(),
    [locales],
  )
  const activeKey = activeCodes.join(',')

  useEffect(() => {
    if (!activeCodes.length) {
      setProgress({})
      return
    }
    let cancelled = false
    getTranslationProgressAction(businessId, activeCodes).then(res => {
      if (cancelled) return
      if (res.success) setProgress(res.data)
    })
    return () => {
      cancelled = true
    }
  }, [businessId, activeKey])

  function refresh() {
    router.refresh()
  }

  function purchase(locale: StoreLocaleCode) {
    if (locale === primaryLocale) return
    if (liveBalance < LOCALE_CREDITS_PER_MONTH) {
      toast.error(
        t('settings.storeLanguages.needCredits').replace('{{credits}}', String(LOCALE_CREDITS_PER_MONTH)),
      )
      return
    }
    setBusyLocale(locale)
    startTransition(async () => {
      const res = await purchaseLocaleAction(businessId, locale)
      setBusyLocale(null)
      if (!res.success) {
        toast.error(res.error)
        return
      }
      const { creditBalance: nextBalance, ...row } = res.data
      setLocales(prev => {
        const without = prev.filter(l => l.locale !== locale)
        return [...without, row]
      })
      setProgress(prev => ({
        ...prev,
        [locale]: prev[locale] ?? { total: 0, translated: 0, bySection: {} },
      }))
      if (typeof nextBalance === 'number') {
        await syncCredits(businessId, nextBalance)
      } else {
        await syncCredits(businessId)
      }
      toast.success(
        t('settings.storeLanguages.activated')
          .replace('{{locale}}', storeLocaleLabel(locale))
          .replace('{{credits}}', String(LOCALE_CREDITS_PER_MONTH)),
      )
      void getTranslationProgressAction(businessId, [locale]).then(p => {
        if (p.success && p.data[locale]) {
          setProgress(prev => ({ ...prev, [locale]: p.data[locale] }))
        }
      })
      refresh()
    })
  }

  function cancel(locale: StoreLocaleCode) {
    if (
      !confirm(
        t('settings.storeLanguages.cancelConfirm')
          .replace('{{locale}}', storeLocaleLabel(locale))
          .replace('{{code}}', locale),
      )
    ) {
      return
    }
    setBusyLocale(locale)
    startTransition(async () => {
      const res = await cancelLocaleAction(businessId, locale)
      setBusyLocale(null)
      if (!res.success) {
        toast.error(res.error)
        return
      }
      setLocales(prev =>
        prev.map(l => (l.locale === locale ? { ...l, status: 'cancelled' as const } : l)),
      )
      setProgress(prev => {
        const next = { ...prev }
        delete next[locale]
        return next
      })
      toast.success(
        t('settings.storeLanguages.cancelled').replace('{{locale}}', storeLocaleLabel(locale)),
      )
      refresh()
    })
  }

  function setPrimary(locale: StoreLocaleCode) {
    if (locale === primaryLocale) return
    if (
      !confirm(
        t('settings.storeLanguages.primaryConfirm').replace('{{locale}}', storeLocaleLabel(locale)),
      )
    ) {
      return
    }
    setBusyLocale(locale)
    startTransition(async () => {
      const res = await updatePrimaryLocaleAction(businessId, locale)
      setBusyLocale(null)
      if (!res.success) {
        toast.error(res.error)
        return
      }
      setPrimaryLocale(locale)
      setChangePrimaryOpen(false)
      toast.success(
        t('settings.storeLanguages.primaryUpdated').replace('{{locale}}', storeLocaleLabel(locale)),
      )
      refresh()
    })
  }

  const primaryMeta = STORE_LOCALE_CATALOG[primaryLocale]
  const primaryDisplay = storeLocaleSecondaryLabel(primaryLocale)
    ? `${primaryMeta.label} (${storeLocaleSecondaryLabel(primaryLocale)})`
    : primaryMeta.label

  return (
    <div className="space-y-8">
      <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground space-y-1">
        <p>
          {t('settings.storeLanguages.introPrimaryBefore')}
          <strong className="text-foreground">{storeLocaleLabel(primaryLocale)}</strong>
          {t('settings.storeLanguages.introPrimaryAfter')}
        </p>
        <p>
          {t('settings.storeLanguages.introExtra')
            .replace('{{credits}}', String(LOCALE_CREDITS_PER_MONTH))
            .replace('{{balance}}', String(liveBalance))}{' '}
          <Link href="/dashboard/settings/credits" className="underline underline-offset-2">
            {t('settings.storeLanguages.topUp')}
          </Link>
        </p>
        <p>
          {t('settings.storeLanguages.introTranslatePrefix')}
          <Link href="/dashboard/translations" className="underline underline-offset-2">
            {t('settings.storeLanguages.translationsLink')}
          </Link>
          .
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="text-sm font-semibold">{t('settings.storeLanguages.extraTitle')}</h4>
          <span className="text-xs text-muted-foreground">
            {t('settings.storeLanguages.extraCost').replace(
              '{{credits}}',
              String(LOCALE_CREDITS_PER_MONTH),
            )}
          </span>
        </div>
        <div className="divide-y rounded-xl border">
          {STORE_LOCALE_CODES.filter(code => code !== primaryLocale).map(code => {
            const isActive = activeExtra.has(code)
            const isPastDue = pastDue.has(code)
            const row = locales.find(l => l.locale === code)
            const busy = busyLocale === code && pending
            const prog = progress[code]
            const secondary = storeLocaleSecondaryLabel(code)

            return (
              <div key={code} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {STORE_LOCALE_CATALOG[code].label}
                    {secondary ? (
                      <span className="text-muted-foreground font-normal"> · {secondary}</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isActive && row ? (
                      <>
                        <span>
                          {t('settings.storeLanguages.activeNextBill').replace(
                            '{{date}}',
                            new Date(row.next_bill_at).toLocaleDateString(),
                          )}
                        </span>
                        {prog && prog.total > 0 ? (
                          <>
                            <span aria-hidden="true"> · </span>
                            <ProgressLine progress={prog} t={t} />
                          </>
                        ) : null}
                      </>
                    ) : isPastDue ? (
                      t('settings.storeLanguages.pastDue')
                    ) : (
                      t('settings.storeLanguages.publicUrl').replace('{{code}}', code)
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isActive ? (
                    <>
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/translations/${code}`}>
                          {t('settings.storeLanguages.translate')}
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => cancel(code)}
                      >
                        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                        {t('settings.storeLanguages.cancel')}
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      disabled={busy || liveBalance < LOCALE_CREDITS_PER_MONTH}
                      onClick={() => purchase(code)}
                    >
                      {busy ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Plus className="size-3.5" />
                      )}
                      {isPastDue
                        ? t('settings.storeLanguages.reactivate')
                        : t('settings.storeLanguages.add')}{' '}
                      · {LOCALE_CREDITS_PER_MONTH}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold">{t('settings.storeLanguages.primaryTitle')}</h4>
        <div className="rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              <LocaleName code={primaryLocale} />
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('settings.storeLanguages.primaryFree')}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => setChangePrimaryOpen(v => !v)}
          >
            {t('settings.storeLanguages.changePrimary')}
            <ChevronDown className={cn('size-3.5 transition-transform', changePrimaryOpen && 'rotate-180')} />
          </Button>
        </div>
        {changePrimaryOpen ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {STORE_LOCALE_CODES.map(code => {
              const isPrimary = code === primaryLocale
              return (
                <button
                  key={`primary-${code}`}
                  type="button"
                  disabled={pending || isPrimary}
                  onClick={() => setPrimary(code)}
                  className={cn(
                    'flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                    isPrimary
                      ? 'border-foreground bg-foreground text-background'
                      : 'hover:border-foreground/40 disabled:opacity-50',
                  )}
                >
                  <LocaleName code={code} emphasize={isPrimary ? 'primary' : 'muted'} />
                  {isPrimary ? <Check className="size-4 shrink-0" /> : null}
                </button>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t('settings.storeLanguages.primaryHint').replace('{{primary}}', primaryDisplay)}
          </p>
        )}
      </section>
    </div>
  )
}
