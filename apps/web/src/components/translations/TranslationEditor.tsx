'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Check, Loader2, Save, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/currency'
import { saveTranslationsAction } from '@/app/actions/translations'
import {
  applyAiTranslateAction,
  estimateAiTranslateAction,
  type AiTranslateQuote,
} from '@/app/actions/ai-translate'
import type { AiTranslateScope } from '@/lib/ai-translate'
import type { TranslationField } from '@/lib/translation-fields'
import { type TranslationSectionId } from '@/lib/translation-fields'
import { localizeFieldChrome } from '@/lib/translation-ui-i18n'
import { storeLocaleLabel, type StoreLocaleCode } from '@/i18n/store-locales'
import { useSyncCreditBalance } from '@/lib/react-query/hooks/useCredits'
import { useTranslation } from '@/i18n/I18nProvider'

const SECTION_ORDER: TranslationSectionId[] = ['seo', 'page', 'chrome', 'menu', 'order']

export function TranslationEditor({
  businessId,
  locale,
  primary,
  initialFields,
}: {
  businessId: string
  locale: StoreLocaleCode
  primary: StoreLocaleCode
  initialFields: TranslationField[]
}) {
  const { t } = useTranslation()
  const syncCredits = useSyncCreditBalance()
  const [fields, setFields] = useState(initialFields)
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialFields.map(f => [f.id, f.translatedText])),
  )
  const [pending, startTransition] = useTransition()
  const [activeSection, setActiveSection] = useState<TranslationSectionId | 'all'>('all')
  const [quoting, setQuoting] = useState(false)
  const [applying, setApplying] = useState(false)
  const [quote, setQuote] = useState<AiTranslateQuote | null>(null)

  const sectionLabel = (section: TranslationSectionId) => t(`translations.sections.${section}`)

  const dirty = useMemo(() => {
    const out: Record<string, string> = {}
    for (const f of fields) {
      const next = drafts[f.id] ?? ''
      if (next !== f.translatedText) out[f.id] = next
    }
    return out
  }, [drafts, fields])

  const dirtyCount = Object.keys(dirty).length
  const busy = pending || quoting || applying

  const bySection = useMemo(() => {
    const map = new Map<TranslationSectionId, TranslationField[]>()
    for (const section of SECTION_ORDER) map.set(section, [])
    for (const f of fields) {
      map.get(f.section)?.push(f)
    }
    return map
  }, [fields])

  const visibleFields = useMemo(() => {
    if (activeSection === 'all') return fields
    return fields.filter(f => f.section === activeSection)
  }, [activeSection, fields])

  const missingCount = fields.filter(f => {
    const val = drafts[f.id] ?? f.translatedText
    return !f.customized && (!val.trim() || val === f.primaryText)
  }).length

  function setDraft(id: string, value: string) {
    setDrafts(prev => ({ ...prev, [id]: value }))
  }

  function applyAiResult(next: TranslationField[]) {
    setFields(next)
    setDrafts(prev => {
      const out = { ...prev }
      for (const f of next) {
        const previous = fields.find(x => x.id === f.id)
        const wasDirty = previous != null && prev[f.id] !== previous.translatedText
        const aiFilled = previous == null || previous.translatedText !== f.translatedText
        if (aiFilled || !wasDirty) {
          out[f.id] = f.translatedText
        }
      }
      return out
    })
  }

  function save(ids?: string[]) {
    const payload = ids
      ? Object.fromEntries(Object.entries(dirty).filter(([id]) => ids.includes(id)))
      : dirty
    if (!Object.keys(payload).length) {
      toast.message(t('translations.nothingToSave'))
      return
    }
    startTransition(async () => {
      const res = await saveTranslationsAction(businessId, locale, payload)
      if (!res.success) {
        toast.error(res.error)
        return
      }
      setFields(prev => prev.map(f => {
        if (payload[f.id] === undefined) return f
        return {
          ...f,
          translatedText: payload[f.id],
          customized: true,
        }
      }))
      toast.success(t('translations.savedFields').replace('{{count}}', String(res.data.saved)))
    })
  }

  async function openQuote(scope: AiTranslateScope) {
    setQuoting(true)
    const res = await estimateAiTranslateAction(businessId, locale, scope)
    setQuoting(false)
    if (!res.success) {
      toast.error(res.error)
      return
    }
    if (res.data.fieldCount === 0) {
      toast.message(t('translations.nothingLeftInSection'))
      return
    }
    setQuote(res.data)
  }

  async function confirmAi() {
    if (!quote) return
    setApplying(true)
    const res = await applyAiTranslateAction(businessId, locale, quote.scope)
    setApplying(false)
    if (!res.success) {
      toast.error(res.error)
      return
    }
    applyAiResult(res.data.fields)
    setQuote(null)
    if (typeof res.data.creditBalance === 'number') {
      void syncCredits(businessId, res.data.creditBalance)
    } else if (res.data.creditsCharged > 0) {
      void syncCredits(businessId)
    }
    if (res.data.creditsCharged > 0) {
      toast.success(
        t('translations.aiSuccessWithCredits')
          .replace('{{count}}', String(res.data.saved))
          .replace('{{credits}}', String(res.data.creditsCharged)),
      )
    } else {
      toast.success(t('translations.aiSuccess').replace('{{count}}', String(res.data.saved)))
    }
  }

  const quoteCopy = quote
    ? t('translations.quoteCopy')
        .replace('{{words}}', quote.wordCount.toLocaleString('en-US'))
        .replace('{{locale}}', storeLocaleLabel(locale))
        .replace('{{credits}}', String(quote.credits))
        .replace('{{vnd}}', formatCurrency(quote.vndEstimate))
    : ''

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/dashboard/translations" className="underline underline-offset-2">
              {t('translations.breadcrumb')}
            </Link>
            {' / '}
            {storeLocaleLabel(locale)}
          </p>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            {t('translations.translateTo').replace('{{locale}}', storeLocaleLabel(locale))}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('translations.editorHint').replace('{{primary}}', storeLocaleLabel(primary))}
            {missingCount > 0 && (
              <span className="ml-1 text-amber-700">
                · {t('translations.stillUsingPrimary').replace('{{count}}', String(missingCount))}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => openQuote(activeSection === 'all' ? 'all' : activeSection)}
            disabled={busy || visibleFields.length === 0}
          >
            {quoting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {t('translations.translateWithAi')}
          </Button>
          <Button onClick={() => save()} disabled={busy || dirtyCount === 0}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {dirtyCount > 0
              ? t('translations.saveCount').replace('{{count}}', String(dirtyCount))
              : t('translations.save')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setActiveSection('all')}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
            activeSection === 'all' ? 'bg-foreground text-background border-foreground' : 'hover:border-foreground/40',
          )}
        >
          {t('translations.all')} ({fields.length})
        </button>
        {SECTION_ORDER.map(section => {
          const count = bySection.get(section)?.length ?? 0
          if (!count) return null
          return (
            <button
              key={section}
              type="button"
              onClick={() => setActiveSection(section)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                activeSection === section ? 'bg-foreground text-background border-foreground' : 'hover:border-foreground/40',
              )}
            >
              {sectionLabel(section)} ({count})
            </button>
          )
        })}
      </div>

      {visibleFields.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t('translations.emptySection')}
        </div>
      ) : (
        <div className="space-y-8">
          {SECTION_ORDER.filter(s => activeSection === 'all' || activeSection === s).map(section => {
            const sectionFields = bySection.get(section) ?? []
            if (!sectionFields.length) return null

            const groups = new Map<string, TranslationField[]>()
            for (const f of sectionFields) {
              const list = groups.get(f.group) ?? []
              list.push(f)
              groups.set(f.group, list)
            }

            return (
              <section key={section} className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {sectionLabel(section)}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => openQuote(section)}
                    >
                      <Sparkles className="size-3.5" />
                      {t('translations.ai')}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => save(sectionFields.map(f => f.id).filter(id => dirty[id] !== undefined))}
                    >
                      {t('translations.saveSection')}
                    </Button>
                  </div>
                </div>

                {[...groups.entries()].map(([group, groupFields]) => {
                  const localizedGroup = translateFieldGroupSafe(t, group)
                  return (
                  <div key={group} className="rounded-xl border overflow-hidden">
                    <div className="px-4 py-2 bg-muted/40 border-b text-xs font-medium text-muted-foreground">
                      {localizedGroup}
                    </div>
                    <div className="divide-y">
                      {groupFields.map(field => {
                        const value = drafts[field.id] ?? ''
                        const isDirty = dirty[field.id] !== undefined
                        const chrome = localizeFieldChrome(t, field.label, field.group)
                        return (
                          <div key={field.id} className="grid md:grid-cols-2 gap-3 p-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1.5">
                                <p className="text-xs font-medium text-muted-foreground">{chrome.label}</p>
                                {field.customized && !isDirty && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700">
                                    <Check className="size-3" /> {t('translations.badgeTranslated')}
                                  </span>
                                )}
                                {isDirty && (
                                  <span className="text-[10px] text-amber-700">{t('translations.badgeUnsaved')}</span>
                                )}
                              </div>
                              <p className="text-sm whitespace-pre-wrap rounded-lg bg-muted/50 px-3 py-2 min-h-[40px]">
                                {field.primaryText || <span className="text-muted-foreground italic">{t('translations.emptyValue')}</span>}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                                {storeLocaleLabel(locale)}
                              </p>
                              {field.multiline ? (
                                <Textarea
                                  value={value}
                                  onChange={e => setDraft(field.id, e.target.value)}
                                  rows={3}
                                  placeholder={field.primaryText}
                                  className="text-sm"
                                />
                              ) : (
                                <Input
                                  value={value}
                                  onChange={e => setDraft(field.id, e.target.value)}
                                  placeholder={field.primaryText}
                                  className="text-sm"
                                />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  )
                })}
              </section>
            )
          })}
        </div>
      )}

      <Dialog open={quote != null} onOpenChange={open => { if (!open && !applying) setQuote(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('translations.translateWithAi')}</DialogTitle>
            <DialogDescription>{quoteCopy}</DialogDescription>
          </DialogHeader>
          {quote && (
            <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm space-y-1.5">
              <p>
                <span className="text-muted-foreground">{t('translations.fieldsLabel')} </span>
                {quote.fieldCount}
                {quote.scope !== 'all' && (
                  <span className="text-muted-foreground"> · {sectionLabel(quote.scope)}</span>
                )}
              </p>
              <p>
                <span className="text-muted-foreground">{t('translations.balanceLabel')} </span>
                {quote.balance} {t('translations.creditsUnit')}
              </p>
              {quote.insufficient && (
                <p className="text-destructive">
                  {t('translations.insufficientCredits')}{' '}
                  <Link href="/dashboard/settings/credits" className="underline underline-offset-2">
                    {t('translations.topUp')}
                  </Link>
                </p>
              )}
              {!quote.configured && (
                <p className="text-amber-700">
                  {t('translations.aiNotConfigured')}
                </p>
              )}
            </div>
          )}
          {applying && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              {t('translations.translating')}
            </p>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setQuote(null)} disabled={applying}>
              {t('translations.cancel')}
            </Button>
            <Button
              onClick={confirmAi}
              disabled={applying || !quote || quote.insufficient || !quote.configured}
            >
              {applying ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {t('translations.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function translateFieldGroupSafe(t: (key: string) => string, group: string) {
  return localizeFieldChrome(t, '', group).group
}
