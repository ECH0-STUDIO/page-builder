'use client'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/I18nProvider'

/** Badge for fields that vary per content language (not shared across locales). */
export function LocaleFieldLabel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      <Label className="text-xs">{children}</Label>
      <span className="text-[9px] uppercase tracking-wide text-muted-foreground font-medium shrink-0">
        {t('pageBuilder.perLocaleBadge')}
      </span>
    </div>
  )
}
