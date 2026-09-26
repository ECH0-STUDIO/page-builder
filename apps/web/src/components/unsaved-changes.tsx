'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '@/i18n/I18nProvider'
import { Button } from '@/components/ui/button'

type Registration = {
  isDirty: () => boolean
  save: () => Promise<boolean>
}

type UnsavedChangesApi = {
  register: (reg: Registration) => () => void
  bump: () => void
  confirmLeave: (proceed: () => void) => void
}

const UnsavedChangesContext = createContext<UnsavedChangesApi | null>(null)

export function useConfirmLeave() {
  const ctx = useContext(UnsavedChangesContext)
  return useCallback((proceed: () => void) => {
    if (!ctx) {
      proceed()
      return
    }
    ctx.confirmLeave(proceed)
  }, [ctx])
}

export function useRegisterUnsavedChanges(when: boolean, save: () => Promise<boolean>) {
  const ctx = useContext(UnsavedChangesContext)
  const whenRef = useRef(when)
  const saveRef = useRef(save)
  whenRef.current = when
  saveRef.current = save

  useEffect(() => {
    if (!ctx) return
    return ctx.register({
      isDirty: () => whenRef.current,
      save: () => saveRef.current(),
    })
  }, [ctx])

  useEffect(() => {
    ctx?.bump()
  }, [ctx, when])
}

export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const regs = useRef(new Set<Registration>())
  const [, setTick] = useState(0)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const pending = useRef<(() => void) | null>(null)
  const sentinel = useRef(false)
  const skipPop = useRef(false)

  const anyDirty = useCallback(() => {
    for (const reg of regs.current) {
      if (reg.isDirty()) return true
    }
    return false
  }, [])

  const bump = useCallback(() => setTick(n => n + 1), [])

  const register = useCallback((reg: Registration) => {
    regs.current.add(reg)
    return () => {
      regs.current.delete(reg)
    }
  }, [])

  const confirmLeave = useCallback((proceed: () => void) => {
    if (!anyDirty()) {
      proceed()
      return
    }
    pending.current = proceed
    setOpen(true)
  }, [anyDirty])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!anyDirty()) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [anyDirty])

  const dirtyNow = anyDirty()

  useEffect(() => {
    if (!dirtyNow) {
      sentinel.current = false
      return
    }
    if (sentinel.current) return
    // Keep Next.js history fields (__NA) by going through the patched pushState.
    history.pushState({ ...(history.state ?? {}), eateryUnsaved: true }, '')
    sentinel.current = true
  }, [anyDirty, dirtyNow])

  useEffect(() => {
    const onPop = () => {
      if (skipPop.current) {
        skipPop.current = false
        sentinel.current = false
        return
      }
      if (!anyDirty()) {
        sentinel.current = false
        return
      }
      history.pushState({ ...(history.state ?? {}), eateryUnsaved: true }, '')
      sentinel.current = true
      pending.current = () => {
        skipPop.current = true
        history.go(-2)
      }
      setOpen(true)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [anyDirty])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element | null)?.closest?.('a')
      if (!anchor) return
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      let url: URL
      try {
        url = new URL(href, window.location.href)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname && url.search === window.location.search) return
      if (!anyDirty()) return
      event.preventDefault()
      event.stopPropagation()
      pending.current = () => {
        window.location.assign(url.pathname + url.search + url.hash)
      }
      setOpen(true)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [anyDirty])

  async function apply() {
    setSaving(true)
    const dirty = [...regs.current].filter(reg => reg.isDirty())
    let ok = true
    for (const reg of dirty) {
      try {
        const saved = await reg.save()
        if (!saved) ok = false
      } catch {
        ok = false
      }
    }
    setSaving(false)
    if (!ok) return
    const go = pending.current
    pending.current = null
    setOpen(false)
    go?.()
  }

  function discard() {
    const go = pending.current
    pending.current = null
    setOpen(false)
    go?.()
  }

  function stay() {
    pending.current = null
    setOpen(false)
  }

  const api = useMemo(
    () => ({ register, bump, confirmLeave }),
    [register, bump, confirmLeave],
  )

  return (
    <UnsavedChangesContext.Provider value={api}>
      {children}
      {open && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="unsaved-title"
            className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl"
          >
            <h2 id="unsaved-title" className="text-lg font-semibold">
              {t('unsavedPrompt.title')}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{t('unsavedPrompt.body')}</p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={stay} disabled={saving}>
                {t('unsavedPrompt.stay')}
              </Button>
              <Button type="button" variant="secondary" onClick={discard} disabled={saving}>
                {t('unsavedPrompt.discard')}
              </Button>
              <Button type="button" onClick={() => void apply()} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                {t('unsavedPrompt.save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </UnsavedChangesContext.Provider>
  )
}
