'use client'

import { PAGE_TEMPLATES } from './templates'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useTranslation } from '@/i18n/I18nProvider'

interface TemplatePickerProps {
  onSelect: (templateId: string) => void
  onClose?: () => void
  canClose?: boolean
  /** Hide the blank canvas option (e.g. first-run “use a template” path). */
  hideBlank?: boolean
}

export function TemplatePicker({
  onSelect,
  onClose,
  canClose,
  hideBlank = false,
}: TemplatePickerProps) {
  const { t } = useTranslation()
  const templates = hideBlank
    ? PAGE_TEMPLATES.filter(tmpl => tmpl.id !== 'blank')
    : PAGE_TEMPLATES

  return (
    <div className="fixed inset-0 z-[99999] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-picker-title"
        className="relative bg-card border border-border rounded-2xl shadow-xl max-w-2xl w-full p-8 space-y-6"
      >
        {canClose && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
            aria-label={t('pageBuilder.cancel')}
          >
            <X className="size-5 text-muted-foreground" />
          </button>
        )}
        <div className="text-center space-y-1.5">
          <h2 id="template-picker-title" className="text-2xl font-bold">
            {t('pageBuilder.templatePickerTitle')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('pageBuilder.templatePickerHint')}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map(tmpl => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => onSelect(tmpl.id)}
              className={cn(
                'group text-left p-4 rounded-xl border border-border hover:border-primary',
                'bg-background hover:bg-primary/5 transition-all duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              )}
            >
              <p className="font-semibold text-sm">{t(tmpl.label)}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {t(tmpl.description)}
              </p>
              {tmpl.blocks.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tmpl.blocks.map((b, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground capitalize"
                    >
                      {b.type.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
