'use client'

import { useRouter } from 'next/navigation'
import { Globe, Loader2, Check, Circle, ArrowLeft, ExternalLink, ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getPublicStoreUrl } from '@/lib/site-urls'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/I18nProvider'

export type SaveStatus = 'idle' | 'saving' | 'saved'

interface PublishBarProps {
  businessName: string
  slug: string
  published: boolean
  hasUnpublishedChanges: boolean
  saveStatus: SaveStatus
  onPublish: (state: boolean) => void
  publishing: boolean
  onTogglePreview: () => void
}

export function PublishBar({
  businessName,
  slug,
  published,
  hasUnpublishedChanges,
  saveStatus,
  onPublish,
  publishing,
  onTogglePreview,
}: PublishBarProps) {
  const router = useRouter()
  const { t } = useTranslation()

  const showChanges = published && hasUnpublishedChanges

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

      {/* Autosave status */}
      <div className="flex items-center gap-2 shrink-0">
        {saveStatus === 'idle' && (
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Circle className="size-2 fill-muted-foreground text-muted-foreground" />
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
          href={getPublicStoreUrl(slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 mr-1 sm:mr-2 p-1.5 sm:p-0 rounded-md sm:rounded-none hover:bg-accent sm:hover:bg-transparent"
          title={t('pageBuilder.viewLive')}
        >
          <ExternalLink className="size-3.5" />
          <span className="hidden md:inline">{t('pageBuilder.viewLive')}</span>
        </a>
      )}

      {/* Preview Toggle */}
      <button
        type="button"
        onClick={onTogglePreview}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 px-2 py-1.5 rounded-md hover:bg-accent"
        title={t('pageBuilder.preview')}
      >
        <Globe className="size-3.5" />
        <span className="hidden md:inline">{t('pageBuilder.preview')}</span>
      </button>

      {/* Publish state badge */}
      <Badge
        variant="outline"
        className={cn(
          'text-xs shrink-0 hidden md:flex items-center gap-1.5 pl-2',
          showChanges
            ? 'border-yellow-500/40 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
            : published
              ? 'border-green-500/40 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
              : 'border-border text-muted-foreground'
        )}
      >
        {showChanges ? (
          <>
            <Circle className="size-2 fill-yellow-500 text-yellow-500" />
            {t('pageBuilder.changes')}
          </>
        ) : published ? (
          <>
            <Circle className="size-2 fill-green-600 text-green-600" />
            {t('pageBuilder.live')}
          </>
        ) : (
          t('pageBuilder.draft')
        )}
      </Badge>

      {/* Publish Dropdown */}
      <div className="flex items-center shrink-0">
        <DropdownMenu>
          <div className="flex bg-primary rounded-md shadow-sm">
            <button
              onClick={() => onPublish(true)}
              disabled={publishing}
              className="h-7 px-3 text-xs font-semibold rounded-l-md transition-colors flex items-center justify-center min-w-[70px] bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {publishing ? <Loader2 className="size-3.5 animate-spin" /> : t('pageBuilder.publish')}
            </button>
            <div className="w-px bg-primary-foreground/20" />
            <DropdownMenuTrigger asChild>
              <button
                disabled={publishing}
                className="h-7 px-1.5 rounded-r-md transition-colors flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <ChevronDown className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
          </div>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onPublish(true)}>
              {t('pageBuilder.publishToLive')}
            </DropdownMenuItem>
            {published && (
              <DropdownMenuItem onClick={() => onPublish(false)}>
                {t('pageBuilder.saveAsDraft')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
