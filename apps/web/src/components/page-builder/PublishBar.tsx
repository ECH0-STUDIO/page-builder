'use client'

import { useRouter } from 'next/navigation'
import { Globe, Loader2, Check, Circle, ArrowLeft } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/I18nProvider'

export type SaveStatus = 'idle' | 'saving' | 'saved'

interface PublishBarProps {
  businessName: string
  slug: string
  published: boolean
  saveStatus: SaveStatus
  onPublish: (state: boolean) => void
  publishing: boolean
  onSaveNow: () => void
}

export function PublishBar({
  businessName,
  slug,
  published,
  saveStatus,
  onPublish,
  publishing,
}: PublishBarProps) {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <div className="h-12 shrink-0 border-b border-border bg-background/95 backdrop-blur-sm flex items-center px-3 gap-2">

      {/* ← Back */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-accent shrink-0"
        title={t('pageBuilder.back')}
      >
        <ArrowLeft className="size-4" />
        <span className="hidden md:inline text-xs font-medium">{t('pageBuilder.back')}</span>
      </button>

      <div className="w-px h-5 bg-border shrink-0" />

      {/* Business name */}
      <span className="font-semibold text-sm truncate max-w-[140px]">{businessName}</span>
      <span className="text-muted-foreground/40 text-xs hidden lg:inline shrink-0">/ Page Builder</span>

      <div className="flex-1 min-w-0" />

      {/* Save status area */}
      <div className="flex items-center gap-2 shrink-0">
        {saveStatus === 'idle' && (
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Circle className="size-2 fill-muted-foreground" />
            <span>{t('pageBuilder.unsaved')}</span>
          </span>
        )}
        {saveStatus === 'saving' && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> {t('pageBuilder.saving')}
          </span>
        )}
        {saveStatus === 'saved' && (
          <span className="flex items-center gap-1.5 text-xs text-green-600">
            <Check className="size-3" />
            <span className="hidden sm:inline">{t('pageBuilder.saved')}</span>
          </span>
        )}
      </div>

      <div className="w-px h-5 bg-border shrink-0" />

      {/* View live */}
      {published && (
        <a
          href={`/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title={t('pageBuilder.preview')}
        >
          <Globe className="size-3.5" />
          <span>{t('pageBuilder.preview')}</span>
        </a>
      )}

      {/* Status badge */}
      <Badge
        variant="outline"
        className={cn(
          'text-xs shrink-0 hidden md:flex',
          published
            ? 'border-green-500/40 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
            : 'border-border text-muted-foreground'
        )}
      >
        {published ? t('pageBuilder.live') : t('pageBuilder.draft')}
      </Badge>

      {/* Publish buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {published && (
          <button
            onClick={() => onPublish(false)}
            disabled={publishing}
            className="h-7 px-3 text-xs font-semibold rounded-md transition-colors flex items-center justify-center min-w-[70px] bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-50"
          >
            {t('pageBuilder.unpublish')}
          </button>
        )}
        <button
          onClick={() => onPublish(true)}
          disabled={publishing}
          className="h-7 px-3 text-xs font-semibold rounded-md transition-colors flex items-center justify-center min-w-[70px] bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {publishing ? <Loader2 className="size-3.5 animate-spin" /> : t('pageBuilder.publish')}
        </button>
      </div>
    </div>
  )
}
