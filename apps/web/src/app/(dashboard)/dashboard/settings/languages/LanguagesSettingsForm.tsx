'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, Loader2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LOCALE_CREDITS_PER_MONTH } from '@/lib/credit-packs'
import {
  STORE_LOCALE_CATALOG,
  STORE_LOCALE_CODES,
  storeLocaleLabel,
  type StoreLocaleCode,
} from '@/i18n/store-locales'
import type { BusinessLocaleRow } from '@/app/actions/business-locales'
import {
  cancelLocaleAction,
  purchaseLocaleAction,
  updatePrimaryLocaleAction,
} from '@/app/actions/business-locales'
import { cn } from '@/lib/utils'

export function LanguagesSettingsForm({
  businessId,
  primaryLocale,
  locales,
  creditBalance,
}: {
  businessId: string
  primaryLocale: StoreLocaleCode
  locales: BusinessLocaleRow[]
  creditBalance: number
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyLocale, setBusyLocale] = useState<string | null>(null)

  const activeExtra = useMemo(
    () => new Set(locales.filter(l => l.status === 'active').map(l => l.locale)),
    [locales],
  )
  const pastDue = useMemo(
    () => new Set(locales.filter(l => l.status === 'past_due').map(l => l.locale)),
    [locales],
  )

  function refresh() {
    router.refresh()
  }

  function purchase(locale: StoreLocaleCode) {
    if (locale === primaryLocale) return
    if (creditBalance < LOCALE_CREDITS_PER_MONTH) {
      toast.error(`Need ${LOCALE_CREDITS_PER_MONTH} credits. Top up first.`)
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
      toast.success(`${storeLocaleLabel(locale)} activated — ${LOCALE_CREDITS_PER_MONTH} credits/month`)
      refresh()
    })
  }

  function cancel(locale: StoreLocaleCode) {
    if (!confirm(`Cancel ${storeLocaleLabel(locale)}? Public /${locale}/… URLs will stop. Translations are kept.`)) {
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
      toast.success(`${storeLocaleLabel(locale)} cancelled`)
      refresh()
    })
  }

  function setPrimary(locale: StoreLocaleCode) {
    if (locale === primaryLocale) return
    if (!confirm(`Make ${storeLocaleLabel(locale)} the primary (free) storefront language? URLs will update.`)) {
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
      toast.success(`Primary language is now ${storeLocaleLabel(locale)}`)
      refresh()
    })
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground space-y-1">
        <p>
          Primary language is <strong className="text-foreground">{storeLocaleLabel(primaryLocale)}</strong> — included free.
          Edit your page and menu in this language only.
        </p>
        <p>
          Extra languages cost <strong className="text-foreground">{LOCALE_CREDITS_PER_MONTH} credits/month</strong> each.
          Balance: <strong className="text-foreground">{creditBalance}</strong> credits.{' '}
          <Link href="/dashboard/settings/credits" className="underline underline-offset-2">
            Top up
          </Link>
        </p>
        <p>
          After activating a language, fill translations in{' '}
          <Link href="/dashboard/translations" className="underline underline-offset-2">
            Translations
          </Link>
          .
        </p>
      </div>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold">Primary language</h4>
        <div className="grid sm:grid-cols-2 gap-2">
          {STORE_LOCALE_CODES.map(code => {
            const meta = STORE_LOCALE_CATALOG[code]
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
                <span>
                  <span className="font-medium">{meta.label}</span>
                  <span className={cn('ml-2 text-xs', isPrimary ? 'text-background/70' : 'text-muted-foreground')}>
                    {meta.labelEn}
                  </span>
                </span>
                {isPrimary ? <Check className="size-4 shrink-0" /> : null}
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h4 className="text-sm font-semibold">Extra languages</h4>
          <span className="text-xs text-muted-foreground">{LOCALE_CREDITS_PER_MONTH} credits / month each</span>
        </div>
        <div className="divide-y rounded-xl border">
          {STORE_LOCALE_CODES.filter(code => code !== primaryLocale).map(code => {
            const meta = STORE_LOCALE_CATALOG[code]
            const isActive = activeExtra.has(code)
            const isPastDue = pastDue.has(code)
            const row = locales.find(l => l.locale === code)
            const busy = busyLocale === code && pending

            return (
              <div key={code} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {meta.label}{' '}
                    <span className="text-muted-foreground font-normal">· {meta.labelEn}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isActive && row
                      ? `Active · next bill ${new Date(row.next_bill_at).toLocaleDateString()}`
                      : isPastDue
                        ? 'Past due — top up credits and reactivate'
                        : `Public URL: /${code}/{slug}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isActive ? (
                    <>
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/translations/${code}`}>Translate</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => cancel(code)}
                      >
                        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      disabled={busy || creditBalance < LOCALE_CREDITS_PER_MONTH}
                      onClick={() => purchase(code)}
                    >
                      {busy ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Plus className="size-3.5" />
                      )}
                      {isPastDue ? 'Reactivate' : 'Add'} · {LOCALE_CREDITS_PER_MONTH}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
