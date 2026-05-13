'use client'

import { PAGE_TEMPLATES } from './templates'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useTranslation } from '@/i18n/I18nProvider'

interface TemplatePickerProps {
  onSelect: (templateId: string) => void
  onClose?: () => void
  canClose?: boolean
}

export function TemplatePicker({ onSelect, onClose, canClose }: TemplatePickerProps) {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-card border border-border rounded-2xl shadow-xl max-w-2xl w-full p-8 space-y-6">
        {canClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="size-5 text-muted-foreground" />
          </button>
        )}
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl font-bold">{t('pageBuilder.templatePickerTitle')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('pageBuilder.templatePickerHint')}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PAGE_TEMPLATES.map(tmpl => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => onSelect(tmpl.id)}
              className={cn(
                'group text-left p-4 rounded-xl border border-border hover:border-primary',
                'bg-background hover:bg-primary/5 transition-all duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
              )}
            >
              <div className="text-2xl mb-2">{tmpl.emoji}</div>
              <p className="font-semibold text-sm">{tmpl.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{tmpl.description}</p>
              {tmpl.blocks.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tmpl.blocks.map((b, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground capitalize">
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
