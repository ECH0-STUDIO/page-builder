'use client'

import { Label } from '@/components/ui/label'
import { useTranslation } from '@/i18n/I18nProvider'

interface CustomCssEditorProps {
  value: string
  onChange: (css: string) => void
}

export function CustomCssEditor({ value, onChange }: CustomCssEditorProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('pageBuilder.customCss')}
        </Label>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
          {t('pageBuilder.customCssHint')}
        </p>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        spellCheck={false}
        placeholder={`/* Target the block's root element */
section {
  border-radius: 16px;
  overflow: hidden;
}

/* Target a heading inside this block */
h1 {
  letter-spacing: -0.04em;
}

/* Target a specific button you found in Inspect */
button.cta-primary {
  border-radius: 4px;
}

/* Media queries work too */
@media (max-width: 640px) {
  section { padding: 24px 16px; }
}`}
        rows={12}
        className="w-full rounded-lg border border-border bg-gray-950 dark:bg-black text-gray-100 font-mono text-xs p-3 resize-y focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
      />
    </div>
  )
}
