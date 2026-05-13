'use client'

import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { BlockSpacing } from '../types'
import { useTranslation } from '@/i18n/I18nProvider'

interface SpacingControlsProps {
  spacing: BlockSpacing
  onChange: (s: BlockSpacing) => void
}

function NumInput({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-0.5">
      <input
        type="number"
        value={value}
        min={0}
        max={500}
        step={4}
        onChange={e => onChange(Math.max(0, Number(e.target.value)))}
        className="w-14 h-7 text-center text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <span className="text-[10px] text-muted-foreground">px</span>
    </div>
  )
}

export function SpacingControls({ spacing, onChange }: SpacingControlsProps) {
  const { t } = useTranslation()

  function set<K extends keyof BlockSpacing>(key: K, value: number) {
    onChange({ ...spacing, [key]: value })
  }

  return (
    <div className="space-y-4">

      {/* Padding — box model visualiser */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('pageBuilder.outerPadding')}
        </Label>
        <p className="text-[11px] text-muted-foreground mt-0.5">{t('pageBuilder.paddingHint')}</p>

        <div className="mt-2 rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/10 p-3 space-y-2">
          <div className="flex justify-center">
            <NumInput value={spacing.padding_top} onChange={v => set('padding_top', v)} />
          </div>
          <div className="flex items-center gap-2">
            <NumInput value={spacing.padding_left} onChange={v => set('padding_left', v)} />
            <div className="flex-1 min-h-[36px] rounded-lg border border-dashed border-blue-300 dark:border-blue-800 bg-white/60 dark:bg-black/10 flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground/50 select-none">{t('pageBuilder.content')}</span>
            </div>
            <NumInput value={spacing.padding_right} onChange={v => set('padding_right', v)} />
          </div>
          <div className="flex justify-center">
            <NumInput value={spacing.padding_bottom} onChange={v => set('padding_bottom', v)} />
          </div>
        </div>
      </div>

      {/* Margin — top + bottom only */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('pageBuilder.marginTitle')}
        </Label>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center gap-1">
            <NumInput value={spacing.margin_top} onChange={v => set('margin_top', v)} />
            <span className="text-[10px] text-muted-foreground">{t('pageBuilder.marginTop')}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <NumInput value={spacing.margin_bottom} onChange={v => set('margin_bottom', v)} />
            <span className="text-[10px] text-muted-foreground">{t('pageBuilder.marginBottom')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
