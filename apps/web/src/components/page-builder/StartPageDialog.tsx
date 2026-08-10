'use client'

import { FilePlus2, LayoutTemplate } from 'lucide-react'
import { useTranslation } from '@/i18n/I18nProvider'
import { cn } from '@/lib/utils'

interface StartPageDialogProps {
  onStartBlank: () => void
  onUseTemplate: () => void
}

/** First-run prompt when the page builder has no sections yet. */
export function StartPageDialog({ onStartBlank, onUseTemplate }: StartPageDialogProps) {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-[99999] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-page-dialog-title"
        className="relative bg-card border border-border rounded-2xl shadow-xl max-w-lg w-full p-8 space-y-6"
      >
        <div className="text-center space-y-1.5">
          <h2 id="start-page-dialog-title" className="text-2xl font-bold">
            {t('pageBuilder.startDialogTitle')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('pageBuilder.startDialogHint')}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onUseTemplate}
            className={cn(
              'group text-left p-5 rounded-xl border border-border hover:border-primary',
              'bg-background hover:bg-primary/5 transition-all duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            )}
          >
            <LayoutTemplate className="size-6 text-primary mb-3" />
            <p className="font-semibold text-sm">{t('pageBuilder.useTemplate')}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {t('pageBuilder.useTemplateHint')}
            </p>
          </button>

          <button
            type="button"
            onClick={onStartBlank}
            className={cn(
              'group text-left p-5 rounded-xl border border-border hover:border-primary',
              'bg-background hover:bg-primary/5 transition-all duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            )}
          >
            <FilePlus2 className="size-6 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
            <p className="font-semibold text-sm">{t('pageBuilder.startBlank')}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {t('pageBuilder.startBlankHint')}
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}
