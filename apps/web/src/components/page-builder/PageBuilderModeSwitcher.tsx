'use client'

/**
 * Landing | Order page switcher for the unified page builder.
 * Theme is shared; each mode keeps its own canvas and page-specific settings.
 */

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/I18nProvider'

export type BuilderPageMode = 'landing' | 'order'

export function builderPagesHref(mode: BuilderPageMode): string {
  return mode === 'order' ? '/dashboard/pages?page=order' : '/dashboard/pages'
}

export function PageBuilderModeSwitcher({ mode }: { mode: BuilderPageMode }) {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <div
      className="flex items-center rounded-lg border border-border p-0.5 shrink-0"
      role="tablist"
      aria-label={t('pageBuilder.pageSwitcherLabel')}
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'landing'}
        onClick={() => {
          if (mode !== 'landing') router.push(builderPagesHref('landing'))
        }}
        className={cn(
          'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
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
        onClick={() => {
          if (mode !== 'order') router.push(builderPagesHref('order'))
        }}
        className={cn(
          'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
          mode === 'order'
            ? 'bg-accent text-foreground'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {t('pageBuilder.modeOrder')}
      </button>
    </div>
  )
}
