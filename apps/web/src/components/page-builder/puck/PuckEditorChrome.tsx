'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ExternalLink,
  Globe,
  Loader2,
  PanelLeft,
  PanelRight,
  Settings,
  Eye,
  X,
} from 'lucide-react'
import { usePuck } from '@puckeditor/core'
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
import type { SaveStatus } from '../PublishBar'
import { ROOT_ZONE } from './constants'

/** Keep Puck's internal previewMode in sync with shell state (ui prop is initial-only). */
function PuckPreviewSync({ previewMode }: { previewMode: boolean }) {
  const { dispatch } = usePuck()

  useEffect(() => {
    dispatch({
      type: 'setUi',
      ui: {
        previewMode: previewMode ? 'interactive' : 'edit',
        leftSideBarVisible: !previewMode,
        rightSideBarVisible: !previewMode,
      },
      recordHistory: false,
    })
  }, [previewMode, dispatch])

  return null
}

interface PuckEditorChromeProps {
  saveStatus: SaveStatus
  published: boolean
  hasUnpublishedChanges: boolean
  publishing: boolean
  slug: string
  previewMode: boolean
  onTogglePreview: () => void
  onPublish: (state: boolean) => void
  onOpenGlobalSettings: () => void
}

export function PuckHeaderBack() {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={() => router.push('/dashboard')}
      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-accent shrink-0 mr-1"
      title={t('pageBuilder.back')}
    >
      <ArrowLeft className="size-4" />
      <span className="hidden sm:inline text-xs font-medium">{t('pageBuilder.back')}</span>
    </button>
  )
}

function PuckSidebarToggles() {
  const { dispatch, appState } = usePuck()
  const { t } = useTranslation()
  const leftVisible = appState.ui.leftSideBarVisible
  const rightVisible = appState.ui.rightSideBarVisible

  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <button
        type="button"
        onClick={() => dispatch({ type: 'setUi', ui: { leftSideBarVisible: !leftVisible } })}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          leftVisible ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent',
        )}
        title={t('puck.toggleBlocks')}
      >
        <PanelLeft className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: 'setUi', ui: { rightSideBarVisible: !rightVisible } })}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          rightVisible ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent',
        )}
        title={t('puck.toggleSettings')}
      >
        <PanelRight className="size-4" />
      </button>
    </div>
  )
}

/** Single-row header — replaces Puck's default header to avoid duplicated controls. */
export function PuckCustomHeader({
  businessName,
  pathLabel,
  previewMode,
  onTogglePreview,
  chrome,
}: {
  businessName: string
  pathLabel: string
  previewMode: boolean
  onTogglePreview: () => void
  chrome: React.ReactNode
}) {
  const { t } = useTranslation()

  if (previewMode) {
    return (
      <header className="eatery-puck-header flex items-center justify-center h-12 px-2 shrink-0 w-full min-w-0 border-b border-primary/20 bg-primary text-primary-foreground relative z-50">
        <span className="text-sm font-medium tracking-wide flex items-center gap-2">
          <Eye className="size-4 opacity-90" />
          {t('pageBuilder.preview')}
        </span>
        <button
          type="button"
          onClick={onTogglePreview}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-primary-foreground/10 rounded-full transition-colors"
          title={t('pageBuilder.closePreview')}
        >
          <X className="size-5" />
        </button>
      </header>
    )
  }

  return (
    <header className="eatery-puck-header flex items-center gap-2 h-12 px-2 shrink-0 w-full min-w-0 border-b border-border bg-background">
      <PuckHeaderBack />
      <PuckSidebarToggles />
      <div className="flex items-baseline gap-2 min-w-0 shrink">
        <span className="font-semibold text-sm truncate max-w-[140px] sm:max-w-[220px]">{businessName}</span>
        <span className="text-xs text-muted-foreground truncate hidden sm:inline">{pathLabel}</span>
      </div>
      <div className="flex-1 min-w-0" />
      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">{chrome}</div>
    </header>
  )
}

export function PuckHeaderActions({
  saveStatus,
  published,
  hasUnpublishedChanges,
  publishing,
  slug,
  previewMode,
  onTogglePreview,
  onPublish,
  onOpenGlobalSettings,
}: PuckEditorChromeProps) {
  const { t } = useTranslation()
  const showChanges = published && hasUnpublishedChanges

  return (
    <>
      <PuckPreviewSync previewMode={previewMode} />
      <div className="flex items-center gap-2 flex-wrap justify-end">
      {/* Autosave */}
      <div className="flex items-center gap-2 shrink-0">
        {saveStatus === 'idle' && (
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-muted-foreground shrink-0" />
            {t('pageBuilder.unsaved')}
          </span>
        )}
        {saveStatus === 'saving' && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            {t('pageBuilder.saving')}
          </span>
        )}
        {saveStatus === 'saved' && (
          <span className="flex items-center gap-1.5 text-xs text-green-600">
            <Check className="size-3" />
            <span className="hidden sm:inline">{t('pageBuilder.saved')}</span>
          </span>
        )}
      </div>

      <div className="w-px h-5 bg-border shrink-0 hidden sm:block" />

      {published && (
        <a
          href={getPublicStoreUrl(slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 px-2 py-1.5 rounded-md hover:bg-accent"
        >
          <ExternalLink className="size-3.5" />
          <span className="hidden md:inline">{t('pageBuilder.viewLive')}</span>
        </a>
      )}

      <button
        type="button"
        onClick={onTogglePreview}
        className={cn(
          'flex items-center gap-1 text-xs transition-colors shrink-0 px-2 py-1.5 rounded-md',
          previewMode
            ? 'bg-accent text-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent',
        )}
      >
        <Globe className="size-3.5" />
        <span className="hidden md:inline">
          {previewMode ? t('pageBuilder.closePreview') : t('pageBuilder.preview')}
        </span>
      </button>

      <Badge
        variant="outline"
        className={cn(
          'text-xs shrink-0 hidden lg:flex items-center gap-1.5 pl-2',
          showChanges
            ? 'border-yellow-500/40 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
            : published
              ? 'border-green-500/40 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
              : 'border-border text-muted-foreground',
        )}
      >
        {showChanges ? (
          <>
            <span className="size-1.5 rounded-full bg-yellow-500 shrink-0" aria-hidden />
            {t('pageBuilder.changes')}
          </>
        ) : published ? (
          <>
            <span className="size-1.5 rounded-full bg-green-600 shrink-0" aria-hidden />
            {t('pageBuilder.live')}
          </>
        ) : (
          t('pageBuilder.draft')
        )}
      </Badge>

      <button
        type="button"
        onClick={onOpenGlobalSettings}
        className="hidden md:flex items-center gap-1 h-7 px-2.5 text-xs rounded-md border border-border bg-background hover:bg-accent transition-colors"
      >
        <Settings className="size-3.5" />
        {t('pageBuilder.globalSettings')}
      </button>

      {/* Publish */}
      <DropdownMenu>
        <div className="flex rounded-md shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => onPublish(true)}
            disabled={publishing}
            className="h-7 px-3 text-xs font-semibold transition-colors flex items-center justify-center min-w-[70px] bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {publishing ? <Loader2 className="size-3.5 animate-spin" /> : t('pageBuilder.publish')}
          </button>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={publishing}
              className="h-7 px-1.5 flex items-center justify-center bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 border-l border-primary-foreground/20"
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
    </>
  )
}

/** Click drawer items to insert at end (in addition to drag-and-drop). */
export function PuckDrawerItem({
  children,
  name,
}: {
  children: React.ReactNode
  name: string
}) {
  const { dispatch, appState } = usePuck()
  const contentLength = appState.data.content.length

  return (
    <button
      type="button"
      className="w-full text-left cursor-pointer"
      onClick={() => {
        dispatch({
          type: 'insert',
          componentType: name,
          destinationZone: ROOT_ZONE,
          destinationIndex: contentLength,
        })
      }}
    >
      {children}
    </button>
  )
}
