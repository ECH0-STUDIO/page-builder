'use client'

/**
 * Puck editor chrome — header, preview sync, publish actions.
 * Preview sync must stay mounted while preview is active (not inside headerActions only).
 */

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ExternalLink,
  Globe,
  Loader2,
  Monitor,
  PanelLeft,
  PanelRight,
  Smartphone,
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
import {
  PageBuilderModeSwitcher,
  type BuilderPageMode,
} from '@/components/page-builder/PageBuilderModeSwitcher'
import type { SaveStatus } from '../PublishBar'
import { ROOT_ZONE } from './constants'
import type { PreviewLayout } from '../render/preview-layout'

/**
 * Keep Puck's internal UI in sync with shell state.
 * `ui` on <Puck> is initial-only — without this, viewport/preview toggles update
 * the header but the canvas keeps stale layout until something else re-renders it.
 */
export function PuckPreviewSync({
  previewMode,
  viewMode = 'desktop',
}: {
  previewMode: boolean
  viewMode?: 'desktop' | 'mobile'
}) {
  const { dispatch } = usePuck()

  useEffect(() => {
    dispatch({
      type: 'setUi',
      ui: {
        previewMode: previewMode ? 'interactive' : 'edit',
        leftSideBarVisible: !previewMode,
        rightSideBarVisible: !previewMode,
        // Touch viewports so root + blocks re-read editorRefs on mobile/desktop switch
        viewports: {
          controlsVisible: false,
          options: [],
          current: {
            width: viewMode === 'mobile' ? 375 : '100%',
            height: 'auto' as const,
          },
        },
      },
      recordHistory: false,
    })
  }, [previewMode, viewMode, dispatch])

  return null
}

/**
 * Recover from stuck Puck drag state (isDragging never cleared after a lost
 * pointerup / cancelled capture). Without this, canvas DnD can die until refresh.
 */
export function PuckDragRecovery() {
  const { appState, dispatch } = usePuck()
  const isDraggingRef = useRef(false)
  isDraggingRef.current = Boolean(appState.ui.isDragging)

  useEffect(() => {
    let stuckTimer: ReturnType<typeof setTimeout> | undefined

    function clearStuckDrag() {
      if (!isDraggingRef.current) return
      dispatch({
        type: 'setUi',
        ui: { isDragging: false },
        recordHistory: false,
      })
      document.documentElement.removeAttribute('data-puck-dragging')
      document.body.removeAttribute('data-puck-dragging')
    }

    function scheduleRecovery() {
      if (stuckTimer) clearTimeout(stuckTimer)
      // Allow normal drag-end animation to finish; only force-clear if still stuck.
      stuckTimer = setTimeout(clearStuckDrag, 1500)
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') clearStuckDrag()
    }

    window.addEventListener('pointerup', scheduleRecovery)
    window.addEventListener('pointercancel', scheduleRecovery)
    window.addEventListener('blur', scheduleRecovery)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      if (stuckTimer) clearTimeout(stuckTimer)
      window.removeEventListener('pointerup', scheduleRecovery)
      window.removeEventListener('pointercancel', scheduleRecovery)
      window.removeEventListener('blur', scheduleRecovery)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [dispatch])

  return null
}

interface PuckEditorChromeProps {
  saveStatus: SaveStatus
  published: boolean
  hasUnpublishedChanges: boolean
  publishing: boolean
  slug: string
  previewMode: boolean
  viewMode: 'desktop' | 'mobile'
  onTogglePreview: () => void
  onViewModeChange: (mode: 'desktop' | 'mobile') => void
  onPublish: (state: boolean) => void
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

export function PuckViewportToggle({
  viewMode,
  onChange,
}: {
  viewMode: 'desktop' | 'mobile'
  onChange: (mode: 'desktop' | 'mobile') => void
}) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center rounded-lg border border-border p-0.5 shrink-0">
      <button
        type="button"
        onClick={() => onChange('desktop')}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          viewMode === 'desktop'
            ? 'bg-accent text-foreground'
            : 'text-muted-foreground hover:bg-accent/60',
        )}
        title={t('pageBuilder.desktop')}
        aria-label={t('pageBuilder.desktop')}
      >
        <Monitor className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange('mobile')}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          viewMode === 'mobile'
            ? 'bg-accent text-foreground'
            : 'text-muted-foreground hover:bg-accent/60',
        )}
        title={t('pageBuilder.mobile')}
        aria-label={t('pageBuilder.mobile')}
      >
        <Smartphone className="size-4" />
      </button>
    </div>
  )
}

/** Single-row header — replaces Puck's default header to avoid duplicated controls. */
export function PuckCustomHeader({
  builderMode,
  previewMode,
  viewMode,
  onTogglePreview,
  onViewModeChange,
  chrome,
}: {
  builderMode?: BuilderPageMode
  previewMode: boolean
  viewMode: 'desktop' | 'mobile'
  onTogglePreview: () => void
  onViewModeChange: (mode: 'desktop' | 'mobile') => void
  chrome: React.ReactNode
}) {
  const { t } = useTranslation()

  if (previewMode) {
    return (
      <header className="eatery-puck-header eatery-puck-header--preview flex items-center justify-center h-12 px-2 shrink-0 w-full min-w-0 border-b border-primary/20 bg-primary text-primary-foreground relative z-50">
        <span className="text-sm font-medium tracking-wide flex items-center gap-2">
          <Eye className="size-4 opacity-90" />
          {t('pageBuilder.preview')}
        </span>
        <div className="absolute left-2 top-1/2 -translate-y-1/2">
          <PuckViewportToggle viewMode={viewMode} onChange={onViewModeChange} />
        </div>
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
    <header className="eatery-puck-header flex items-center gap-1.5 sm:gap-2 min-h-12 py-1.5 px-2 sm:px-3 shrink-0 w-full min-w-0 border-b border-border bg-background overflow-x-auto">
      <PuckHeaderBack />
      {builderMode && <PageBuilderModeSwitcher mode={builderMode} />}
      <PuckSidebarToggles />
      <div className="flex-1 min-w-0" />
      <div className="flex items-center gap-1 shrink-0 justify-end">{chrome}</div>
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
  viewMode,
  onTogglePreview,
  onViewModeChange,
  onPublish,
}: PuckEditorChromeProps) {
  const { t } = useTranslation()
  const showChanges = published && hasUnpublishedChanges

  return (
    <>
      <div className="flex items-center gap-2 shrink-0 mr-1">
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

      <div className="mr-1">
        <PuckViewportToggle viewMode={viewMode} onChange={onViewModeChange} />
      </div>

      <button
        type="button"
        onClick={onTogglePreview}
        className={cn(
          'flex items-center justify-center size-8 transition-colors shrink-0 rounded-md',
          previewMode
            ? 'bg-accent text-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent',
        )}
        title={previewMode ? t('pageBuilder.closePreview') : t('pageBuilder.preview')}
        aria-label={previewMode ? t('pageBuilder.closePreview') : t('pageBuilder.preview')}
      >
        <Globe className="size-4" />
      </button>

      {published && (
        <a
          href={getPublicStoreUrl(slug)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center size-8 text-muted-foreground hover:text-foreground transition-colors shrink-0 rounded-md hover:bg-accent"
          title={t('pageBuilder.viewLive')}
          aria-label={t('pageBuilder.viewLive')}
        >
          <ExternalLink className="size-4" />
        </a>
      )}

      <Badge
        variant="outline"
        className={cn(
          'text-xs shrink-0 hidden md:flex items-center gap-1.5 pl-2',
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

      <DropdownMenu>
        <div className="flex rounded-md shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => onPublish(true)}
            disabled={publishing}
            className="h-8 px-3 text-xs font-semibold transition-colors flex items-center justify-center min-w-[70px] bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {publishing ? <Loader2 className="size-3.5 animate-spin" /> : t('pageBuilder.publish')}
          </button>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={publishing}
              className="h-8 px-1.5 flex items-center justify-center bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 border-l border-primary-foreground/20"
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

export type { PreviewLayout }
