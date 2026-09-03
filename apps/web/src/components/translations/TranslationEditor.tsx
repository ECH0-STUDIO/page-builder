'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Check, Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { saveTranslationsAction } from '@/app/actions/translations'
import type { TranslationField } from '@/lib/translation-fields'
import { SECTION_LABELS, type TranslationSectionId } from '@/lib/translation-fields'
import { storeLocaleLabel, type StoreLocaleCode } from '@/i18n/store-locales'

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
  const [fields, setFields] = useState(initialFields)
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialFields.map(f => [f.id, f.translatedText])),
  )
  const [pending, startTransition] = useTransition()
  const [activeSection, setActiveSection] = useState<TranslationSectionId | 'all'>('all')

  const dirty = useMemo(() => {
    const out: Record<string, string> = {}
    for (const f of fields) {
      const next = drafts[f.id] ?? ''
      if (next !== f.translatedText) out[f.id] = next
    }
    return out
  }, [drafts, fields])

  const dirtyCount = Object.keys(dirty).length

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

  function save(ids?: string[]) {
    const payload = ids
      ? Object.fromEntries(Object.entries(dirty).filter(([id]) => ids.includes(id)))
      : dirty
    if (!Object.keys(payload).length) {
      toast.message('Nothing to save')
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
      toast.success(`Saved ${res.data.saved} field${res.data.saved === 1 ? '' : 's'}`)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/dashboard/translations" className="underline underline-offset-2">
              Translations
            </Link>
            {' / '}
            {storeLocaleLabel(locale)}
          </p>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            Translate to {storeLocaleLabel(locale)}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Primary ({storeLocaleLabel(primary)}) is shown on the left. Empty fields fall back to primary on the live site until you customize them.
            {missingCount > 0 && (
              <span className="ml-1 text-amber-700">· {missingCount} still using primary</span>
            )}
          </p>
        </div>
        <Button onClick={() => save()} disabled={pending || dirtyCount === 0}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save{dirtyCount > 0 ? ` (${dirtyCount})` : ''}
        </Button>
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
          All ({fields.length})
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
              {SECTION_LABELS[section]} ({count})
            </button>
          )
        })}
      </div>

      {visibleFields.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No translatable text found in this section yet. Add content in the page builder or menu first.
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
                    {SECTION_LABELS[section]}
                  </h2>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => save(sectionFields.map(f => f.id).filter(id => dirty[id] !== undefined))}
                  >
                    Save section
                  </Button>
                </div>

                {[...groups.entries()].map(([group, groupFields]) => (
                  <div key={group} className="rounded-xl border overflow-hidden">
                    <div className="px-4 py-2 bg-muted/40 border-b text-xs font-medium text-muted-foreground">
                      {group}
                    </div>
                    <div className="divide-y">
                      {groupFields.map(field => {
                        const value = drafts[field.id] ?? ''
                        const isDirty = dirty[field.id] !== undefined
                        return (
                          <div key={field.id} className="grid md:grid-cols-2 gap-3 p-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1.5">
                                <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
                                {field.customized && !isDirty && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700">
                                    <Check className="size-3" /> translated
                                  </span>
                                )}
                                {isDirty && (
                                  <span className="text-[10px] text-amber-700">unsaved</span>
                                )}
                              </div>
                              <p className="text-sm whitespace-pre-wrap rounded-lg bg-muted/50 px-3 py-2 min-h-[40px]">
                                {field.primaryText || <span className="text-muted-foreground italic">Empty</span>}
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
                ))}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
