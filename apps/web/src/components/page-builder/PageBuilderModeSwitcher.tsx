'use client'

/**
 * Landing | Order page switcher for the unified page builder.
 * Theme is shared; each mode keeps its own canvas and page-specific settings.
 */

import { useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/I18nProvider'

export type BuilderPageMode = 'landing' | 'order'

export function builderPagesHref(mode: BuilderPageMode): string {
  return mode === 'order' ? '/dashboard/pages?page=order' : '/dashboard/pages'
}

export function PageBuilderModeSwitcher({ mode }: { mode: BuilderPageMode }) {
  const router = useRouter()
  const { t } = useTranslation()
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  function switchTo(next: BuilderPageMode) {
    if (next === mode || isPending) return
    startTransition(() => {
      router.push(builderPagesHref(next))
    })
  }

  const overlay =
    isPending && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/70 backdrop-blur-[2px]"
            role="status"
            aria-live="polite"
            aria-label={t('pageBuilder.switchingPage')}
          >
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 shadow-lg text-sm font-medium text-foreground">
              <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
              {t('pageBuilder.switchingPage')}
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <div
        className="flex items-center rounded-lg border border-border p-0.5 shrink-0"
        role="tablist"
        aria-label={t('pageBuilder.pageSwitcherLabel')}
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'landing'}
          disabled={isPending}
          onClick={() => switchTo('landing')}
          className={cn(
            'px-2.5 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-60',
            mode === 'landing'
              ? 'bg-accent text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t('pageBuilder.modeLanding')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'order'}
          disabled={isPending}
          onClick={() => switchTo('order')}
          className={cn(
            'px-2.5 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-60',
            mode === 'order'
              ? 'bg-accent text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t('pageBuilder.modeOrder')}
        </button>
      </div>
      {overlay}
    </>
  )
}
