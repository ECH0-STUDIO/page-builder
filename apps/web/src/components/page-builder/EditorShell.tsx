'use client'

import { useState, useEffect, useCallback, useRef, useId, useMemo } from 'react'
import { toast } from 'sonner'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical, Eye, EyeOff, Plus, Trash2, Copy, MoreHorizontal,
  Sparkles, AlignLeft, MapPin, Grid3x3, QrCode, Monitor, Smartphone, Palette, Menu,
  PanelBottom, Settings, Layers, X, Minus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle } from '@/components/ui/drawer'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/I18nProvider'
import { toSupportedLocale, type SupportedLocale } from '@/i18n/locale'
import { localizeMenuCategories, localizeMenuItems } from '@/i18n/menu-content'
import { useBusiness } from '@/context/BusinessContext'

import { PublishBar } from './PublishBar'
import { TemplatePicker } from './TemplatePicker'
import { BLOCK_REGISTRY, getBlockMeta, getDefaultConfig } from './registry'
import { PAGE_TEMPLATES } from './templates'

import { HeroSettings } from './blocks/HeroBlock'
import { TextImageSettings } from './blocks/TextImageBlock'
import { ContactSettings } from './blocks/ContactBlock'
import { NavbarSettings } from './blocks/NavbarBlock'
import { FooterSettings } from './blocks/FooterBlock'
import { usePageData } from '@/lib/react-query/hooks/usePageBuilder'
import { useQueryClient } from '@tanstack/react-query'
import { MenuGridSettings } from './blocks/MenuGridBlock'
import { QRCodeSettings } from './blocks/QRCodeBlock'
import { SpacingControls } from './blocks/SpacingControls'
import { CustomCssEditor } from './blocks/CustomCssEditor'
import { GlobalSettingsPanel } from './blocks/GlobalSettingsPanel'

import { HeroRender } from './render/HeroRender'
import { TextImageRender } from './render/TextImageRender'
import { ContactRender } from './render/ContactRender'
import { NavbarRender } from './render/NavbarRender'
import { FooterRender } from './render/FooterRender'
import { MenuGridRender } from './render/MenuGridRender'
import type { MenuGridData } from './render/MenuGridRender'
import { QRCodeRender } from './render/QRCodeRender'
import { CartProvider } from './render/CartContext'
import { LiveStoreCart } from './render/LiveStoreCart'
import type { PaymentSettings } from '@/lib/vietqr-utils'
import type { PreviewLayout } from './render/preview-layout'

import { savePageBlocksAction, togglePublishAction, saveThemeAction, savePublishingSettingsAction } from '@/app/actions/page-builder'
import { scopeCSS } from '@/lib/scope-css'

import type {
  PageBlock, BlockType, HeroConfig, TextImageConfig, ContactConfig, MenuGridConfig, QRCodeConfig,
  PublishingSettings, BlockSpacing, ThemeSettings, NavbarConfig,
} from './types'
import { defaultSpacing, defaultNavbarConfig, defaultQRCodeConfig, defaultFooterConfig, defaultThemeSettings } from './types'
import type { Business } from '@/lib/business'
import type { MenuCategory, MenuItem, VariantGroup, VariantOption } from '@/app/actions/menu'

// ─── Canvas layout ─────────────────────────────────────────────────────────────

const CANVAS_DESKTOP_WIDTH = 1440

// ─── Helpers ──────────────────────────────────────────────────────────────────

function blockIcon(type: BlockType) {
  const icons: Record<BlockType, React.ReactNode> = {
    hero: <Sparkles className="size-3.5" />,
    text_image: <AlignLeft className="size-3.5" />,
    contact: <MapPin className="size-3.5" />,
    menu_grid: <Grid3x3 className="size-3.5" />,
    qr_code: <QrCode className="size-3.5" />,
  }
  return icons[type]
}

function makeId() {
  return `temp-${Math.random().toString(36).slice(2)}`
}

// ─── Sortable sidebar item ─────────────────────────────────────────────────────

function SidebarBlockItem({
  block, isSelected, onSelect, onToggleVisible, onDuplicate, onDelete,
}: {
  block: PageBlock
  isSelected: boolean
  onSelect: () => void
  onToggleVisible: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  const meta = getBlockMeta(block.type)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-1.5 px-2 py-2 rounded-lg cursor-pointer group transition-colors select-none',
        isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
      )}
      onClick={onSelect}
    >
      <button
        {...attributes} {...listeners}
        type="button"
        className={cn(
          'shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded transition-opacity',
          isSelected ? 'hover:bg-white/20 text-primary-foreground/70 opacity-70' : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent-foreground/10'
        )}
        onClick={e => e.stopPropagation()}
      >
        <GripVertical className="size-3.5" />
      </button>
      <span className={cn('shrink-0', isSelected ? 'text-primary-foreground' : !block.visible ? 'text-muted-foreground/40' : 'text-muted-foreground')}>
        {!block.visible ? <EyeOff className="size-3.5" /> : blockIcon(block.type)}
      </span>
      <span className={cn('flex-1 text-sm font-medium truncate', !block.visible && 'opacity-50 line-through')}>
        {t(`pageBuilder.blocks.${block.type}.label`)}
      </span>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onToggleVisible() }}
        className={cn(
          'shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity',
          isSelected ? 'hover:bg-white/20 text-primary-foreground/70' : 'hover:bg-accent-foreground/10 text-muted-foreground'
        )}
        title={block.visible ? t('pageBuilder.hiddenFromPage') : t('pageBuilder.hiddenFromPage')}
      >
        {block.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={e => e.stopPropagation()}
            className={cn(
              'shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity',
              isSelected ? 'hover:bg-white/20 text-primary-foreground/70' : 'hover:bg-accent-foreground/10 text-muted-foreground'
            )}
          >
            <MoreHorizontal className="size-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={e => { e.stopPropagation(); onDuplicate() }}>
            <Copy className="size-3.5 mr-2" /> {t('pageBuilder.duplicate')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={e => { e.stopPropagation(); onDelete() }}>
            <Trash2 className="size-3.5 mr-2" /> {t('pageBuilder.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ─── WYSIWYG canvas block card ─────────────────────────────────────────────────

function LiveBlockCard({
  block, isSelected, business, menuGridData, onClick, previewLayout, interactive, editLocale,
}: {
  block: PageBlock
  isSelected: boolean
  business: Business
  menuGridData: MenuGridData
  onClick: () => void
  previewLayout?: PreviewLayout
  interactive?: boolean
  editLocale: SupportedLocale
}) {
  const { t } = useTranslation()
  const meta = getBlockMeta(block.type)
  const spacing = block.spacing ?? defaultSpacing

  // Hidden blocks show as a compact placeholder strip (not rendered)
  if (!block.visible) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'flex items-center gap-3 px-4 py-3 border-y border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/30 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/30 transition-colors group',
          isSelected && 'border-primary/40 bg-primary/5 dark:bg-primary/10'
        )}
      >
        <EyeOff className="size-3.5 text-muted-foreground/50 shrink-0" />
        <span className="text-muted-foreground shrink-0">{blockIcon(block.type)}</span>
        <span className="text-xs text-muted-foreground flex-1 min-w-0 truncate">
          <span className="font-medium">{t(`pageBuilder.blocks.${block.type}.label`)}</span>
          <span className="opacity-50 ml-1.5">{t('pageBuilder.hiddenFromPage')}</span>
        </span>
        {isSelected && (
          <Badge variant="outline" className="text-[10px] text-primary border-primary/30 shrink-0">{t('pageBuilder.editing')}</Badge>
        )}
      </div>
    )
  }

  return (
    <div
      onClick={interactive ? undefined : onClick}
      style={{ marginTop: spacing.margin_top, marginBottom: spacing.margin_bottom }}
      className={cn('relative group', interactive ? '' : 'cursor-pointer')}
    >
      {/* Scoped custom CSS */}
      {block.custom_css && (
        <style dangerouslySetInnerHTML={{
          __html: scopeCSS(block.custom_css, `[data-block-id="${block.id}"]`),
        }} />
      )}

      {/* Selection / hover overlay — edit mode only */}
      {!interactive && (
        <div className={cn(
          'absolute inset-0 z-10 pointer-events-none transition-all duration-150',
          isSelected
            ? 'ring-2 ring-primary ring-inset'
            : 'ring-1 ring-transparent group-hover:ring-primary/40 ring-inset'
        )} />
      )}

      {/* Block label (selected) */}
      {!interactive && isSelected && (
        <div className="absolute top-2 left-2 z-20 pointer-events-none">
          <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-[11px] font-semibold px-2 py-0.5 rounded shadow-md">
            {blockIcon(block.type)} {t(`pageBuilder.blocks.${block.type}.label`)}
          </span>
        </div>
      )}

      {/* Actual rendered content */}
      <div
        data-block-id={block.id}
        style={{
          paddingTop: spacing.padding_top,
          paddingRight: spacing.padding_right,
          paddingBottom: spacing.padding_bottom,
          paddingLeft: spacing.padding_left,
          pointerEvents: interactive ? 'auto' : 'none',
          userSelect: interactive ? 'auto' : 'none',
        }}
      >
        {block.type === 'hero' && (
          <HeroRender
            config={block.config as HeroConfig}
            businessName={business.name}
            previewLayout={previewLayout}
            locale={editLocale}
          />
        )}
        {block.type === 'text_image' && (
          <TextImageRender config={block.config as TextImageConfig} previewLayout={previewLayout} locale={editLocale} />
        )}
        {block.type === 'contact' && <ContactRender config={block.config as ContactConfig} business={business} />}
        {block.type === 'menu_grid' && (
          <MenuGridRender
            config={block.config as MenuGridConfig}
            data={menuGridData}
            previewLayout={previewLayout}
            locale={editLocale}
          />
        )}
        {block.type === 'qr_code' && (
          <QRCodeRender
            config={block.config as QRCodeConfig}
            targetUrl={business.slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${business.slug}` : ''}
            paymentSettings={business.payment_settings}
            downloadLabel={t('qrCodeBlock.saveQrCode')}
            locale={editLocale}
          />
        )}
      </div>
    </div>
  )
}

// ─── Settings panel ────────────────────────────────────────────────────────────

function BlockSettingsPanel({
  block, business, blocks, categories, items, onChange, editLocale,
}: {
  block: PageBlock
  business: Business
  blocks: PageBlock[]
  categories: MenuCategory[]
  items: MenuItem[]
  onChange: (b: PageBlock) => void
  editLocale: SupportedLocale
}) {
  const { t } = useTranslation()
  const anchorId = block.block_anchor_id ?? ''

  return (
    <div className="space-y-6">
      {/* Hidden notice */}
      {!block.visible && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
          <EyeOff className="size-3.5 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">{t('pageBuilder.hiddenNotice')}</p>
        </div>
      )}

      {/* Block-specific settings */}
      {block.type === 'hero' && (
        <HeroSettings config={block.config as HeroConfig} businessId={business.id}
          blocks={blocks}
          editLocale={editLocale}
          onChange={c => onChange({ ...block, config: c })} />
      )}
      {block.type === 'text_image' && (
        <TextImageSettings config={block.config as TextImageConfig} businessId={business.id}
          blocks={blocks}
          editLocale={editLocale}
          onChange={c => onChange({ ...block, config: c })} />
      )}
      {block.type === 'contact' && (
        <ContactSettings config={block.config as ContactConfig} business={business}
          onChange={c => onChange({ ...block, config: c })} />
      )}
      {block.type === 'menu_grid' && (
        <MenuGridSettings
          config={block.config as MenuGridConfig}
          categories={categories}
          items={items}
          editLocale={editLocale}
          onChange={c => onChange({ ...block, config: c })}
        />
      )}
      {block.type === 'qr_code' && (
        <QRCodeSettings
          config={block.config as QRCodeConfig}
          businessSlug={business.slug ?? undefined}
          businessId={business.id}
          editLocale={editLocale}
          onChange={c => onChange({ ...block, config: c })}
        />
      )}

      <Separator />

      {/* Section anchor ID — used by scroll-to links */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('pageBuilder.sectionAnchor')}</Label>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {t('pageBuilder.sectionAnchorHint')} E.g. <code className="font-mono bg-muted px-1 rounded">menu</code> → linked as <code className="font-mono bg-muted px-1 rounded">#menu</code>.
        </p>
        <div className="flex items-center overflow-hidden rounded-lg border border-border h-8">
          <span className="px-2 text-sm text-muted-foreground bg-muted border-r border-border h-full flex items-center select-none">#</span>
          <input
            type="text"
            value={anchorId}
            onChange={e => onChange({ ...block, block_anchor_id: e.target.value.replace(/[^a-z0-9-_]/gi, '') })}
            placeholder={t('pageBuilder.sectionAnchorPlaceholder')}
            className="flex-1 h-full px-2 text-sm bg-transparent outline-none font-mono"
          />
        </div>
      </div>

      <Separator />

      {/* Outer spacing — common */}
      <div className="space-y-3">
        <SpacingControls
          spacing={block.spacing ?? defaultSpacing}
          onChange={s => onChange({ ...block, spacing: s })}
        />
      </div>

      <Separator />

      {/* Custom CSS — common */}
      <CustomCssEditor
        value={block.custom_css ?? ''}
        onChange={css => onChange({ ...block, custom_css: css })}
      />
    </div>
  )
}

// ─── Add block modal ───────────────────────────────────────────────────────────

function AddBlockModal({ open, onClose, onAdd }: {
  open: boolean; onClose: () => void; onAdd: (type: BlockType) => void
}) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{t('pageBuilder.addBlockTitle')}</DialogTitle></DialogHeader>
        <div className="space-y-1 py-2">
          {BLOCK_REGISTRY.map(b => (
            <button
              key={b.type}
              type="button"
              onClick={() => { onAdd(b.type); onClose() }}
              className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent text-left transition-colors group"
            >
              <span className="mt-0.5 text-muted-foreground group-hover:text-foreground">{blockIcon(b.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{t(`pageBuilder.blocks.${b.type}.label`)}</span>
                  {b.phase === 5 && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Phase 5</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{t(`pageBuilder.blocks.${b.type}.description`)}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── EditorShell (main) ────────────────────────────────────────────────────────

type ViewMode = 'desktop' | 'mobile'
type RightPanel = 'block' | 'theme' | 'navbar' | 'footer'

interface EditorShellProps {
  business: Business
  initialBlocks: PageBlock[]
  initialPublishing: PublishingSettings | null
  initialTheme: ThemeSettings | null
  initialCategories: MenuCategory[]
  initialItems: MenuItem[]
  initialVariantGroups: VariantGroup[]
  initialVariantOptions: VariantOption[]
}

export function EditorShell({
  business,
  initialBlocks,
  initialPublishing,
  initialTheme,
  initialCategories,
  initialItems,
  initialVariantGroups,
  initialVariantOptions,
}: EditorShellProps) {
  const [blocks, setBlocks] = useState<PageBlock[]>(() =>
    initialBlocks
      .filter(b => (b.type as string) !== 'navbar')
      .map(b => ({
        ...b,
        spacing: b.spacing ?? { ...defaultSpacing },
        custom_css: b.custom_css ?? '',
        block_anchor_id: b.block_anchor_id ?? null,
      }))
  )
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const initialData = useMemo(() => ({
    blocks: initialBlocks,
    publishing: initialPublishing,
    theme: initialTheme,
  }), [initialBlocks, initialPublishing, initialTheme])
  const { data } = usePageData(business.id, initialData)

  const [selectedId, setSelectedId] = useState<string | null>(
    initialBlocks.filter(b => (b.type as string) !== 'navbar')[0]?.id ?? null
  )
  const [rightPanel, setRightPanel] = useState<RightPanel>('theme')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('saved')
  const [published, setPublished] = useState(initialPublishing?.published ?? false)
  const [publishing, setPublishing] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [showTemplatePicker, setShowTemplatePicker] = useState(initialBlocks.length === 0)
  const [pendingTemplate, setPendingTemplate] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('desktop')
  const [desktopZoom, setDesktopZoom] = useState(1)
  const canvasScrollRef = useRef<HTMLDivElement>(null)
  const [canvasWidth, setCanvasWidth] = useState(0)
  const [theme, setTheme] = useState<ThemeSettings | null>(initialTheme)
  const [publishingSettings, setPublishingSettings] = useState<PublishingSettings | null>(initialPublishing)
  const [mobileBlocksOpen, setMobileBlocksOpen] = useState(false)
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false)
  const [_isPreviewMode, setIsPreviewMode] = useState(false)
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(initialPublishing?.has_unpublished_changes ?? false)
  const [editLocale, setEditLocale] = useState<SupportedLocale>(() =>
    toSupportedLocale(initialPublishing?.language ?? 'vi'),
  )

  const { currentBusiness } = useBusiness()
  const isStaff = currentBusiness?.role === 'staff'
  const isPreviewMode = _isPreviewMode || isStaff

  const openMobileSettingsIfNeed = useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileSettingsOpen(true)
    }
  }, [])

  useEffect(() => {
    if (data) {
      setBlocks(prev => {
        return prev.length === data.blocks.length ? prev : data.blocks.filter(b => (b.type as string) !== 'navbar').map(b => ({
          ...b,
          spacing: b.spacing ?? { ...defaultSpacing },
          custom_css: b.custom_css ?? '',
          block_anchor_id: b.block_anchor_id ?? null,
        }))
      })
      setPublished(data.publishing?.published ?? false)
      setTheme(data.theme)
      setPublishingSettings(data.publishing)
    }
  }, [data])
  const [categories] = useState<MenuCategory[]>(initialCategories)

  const dndId = useId()

  // Real menu data for the canvas — localized for active edit locale
  const menuGridData: MenuGridData = useMemo(() => ({
    categories: localizeMenuCategories(categories, editLocale),
    items: localizeMenuItems(initialItems, editLocale),
    variantGroups: initialVariantGroups,
    variantOptions: initialVariantOptions,
    businessSlug: business.slug ?? '',
  }), [categories, initialItems, initialVariantGroups, initialVariantOptions, business.slug, editLocale])

  const isFirstRender = useRef(true)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const selectedBlock = blocks.find(b => b.id === selectedId) ?? null
  const fontFamily = theme?.font_family ?? 'Inter'
  const headingFont = theme?.heading_font_family ?? 'Inter'
  const navbarConfig = theme?.navbar_config ?? defaultNavbarConfig
  const footerConfig = theme?.footer_config ?? defaultFooterConfig
  const paymentSettings: PaymentSettings = (business.payment_settings as PaymentSettings | null) ?? {}

  const canvasPreviewLayout: PreviewLayout = viewMode === 'mobile' ? 'mobile' : 'desktop'

  const fitDesktopZoom = canvasWidth > 0
    ? Math.min(1, (canvasWidth - 32) / CANVAS_DESKTOP_WIDTH)
    : 1
  const displayDesktopZoom = fitDesktopZoom * desktopZoom
  const showDesktopZoomControls = viewMode === 'desktop' && canvasWidth > 0 && canvasWidth < CANVAS_DESKTOP_WIDTH

  useEffect(() => {
    const el = canvasScrollRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      setCanvasWidth(entries[0]?.contentRect.width ?? 0)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    setDesktopZoom(1)
  }, [viewMode])

  // Derive which panel to show on the right
  const activeRightPanel: RightPanel =
    selectedId ? 'block' : rightPanel

  function openNavbarPanel() {
    setSelectedId(null)
    setRightPanel('navbar')
  }
  function openFooterPanel() {
    setSelectedId(null)
    setRightPanel('footer')
  }
  function openThemePanel() {
    setSelectedId(null)
    setRightPanel('theme')
  }

  // ── Debounced Theme & Publishing saving ─────────────────────────────────────
  const saveThemeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleThemeChange = useCallback((updated: Partial<ThemeSettings>) => {
    setTheme(prev => {
      const next = prev ? { ...prev, ...updated } : { ...defaultThemeSettings, business_id: business.id, id: '', ...updated } as ThemeSettings
      if (saveThemeTimer.current) clearTimeout(saveThemeTimer.current)
      saveThemeTimer.current = setTimeout(() => {
        saveThemeAction(business.id, {
          primary_color: next.primary_color,
          background_color: next.background_color,
          font_family: next.font_family,
          heading_font_family: next.heading_font_family || 'Inter',
        }).then(() => {
          setHasUnpublishedChanges(true)
        }).catch(err => toast.error('Failed to save theme: ' + String(err)))
      }, 1000)
      return next
    })
  }, [business.id])

  const savePubTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handlePublishingChange = useCallback((updated: Partial<PublishingSettings>) => {
    setPublishingSettings(prev => {
      const next = prev ? { ...prev, ...updated } : { business_id: business.id, ...updated } as PublishingSettings
      if (savePubTimer.current) clearTimeout(savePubTimer.current)
      savePubTimer.current = setTimeout(() => {
        savePublishingSettingsAction(business.id, updated)
          .then(() => {
            setHasUnpublishedChanges(true)
          })
          .catch(err => toast.error('Failed to save settings: ' + String(err)))
      }, 1000)
      return next
    })
  }, [business.id])
  // ── Load Google Fonts for canvas preview (body + heading) ─────────────────
  useEffect(() => {
    const families = [...new Set([fontFamily, headingFont])]
    if (families.length === 0) return
    const id = 'pb-canvas-gfont'
    const existing = document.getElementById(id) as HTMLLinkElement | null
    const link: HTMLLinkElement = existing ?? document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?${families.map(f => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700;800`).join('&')}&display=swap`
    if (!existing) document.head.appendChild(link)
    else link.setAttribute('href', link.href) // nudge re-fetch if URL changed
  }, [fontFamily, headingFont])

  // ── Auto-save debounce ────────────────────────────────────────────────────
  const performSave = useCallback(async (blocksToSave: PageBlock[]) => {
    setSaveStatus('saving')
    try {
      const res = await savePageBlocksAction(business.id, blocksToSave)
      if (res.success) {
        setSaveStatus('saved')
        setHasUnpublishedChanges(true)
      } else {
        setSaveStatus('idle')
        console.error('Failed to auto-save:', res.error)
      }
    } catch (e) {
      setSaveStatus('idle')
      console.error('Save error:', e)
    }
  }, [business.id])

  const triggerAutoSave = useCallback((newBlocks: PageBlock[]) => {
    setSaveStatus('idle')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => performSave(newBlocks), 1500)
  }, [performSave])

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    triggerAutoSave(blocks)
  }, [blocks, triggerAutoSave])

  // Explicit save (bypasses debounce)
  function saveNow() {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    performSave(blocks)
  }

  // ── Block mutations ───────────────────────────────────────────────────────
  function addBlock(type: BlockType) {
    const newBlock: PageBlock = {
      id: makeId(),
      business_id: business.id,
      type,
      sort_order: blocks.length,
      visible: true,
      config: getDefaultConfig(type) as PageBlock['config'],
      spacing: { ...defaultSpacing },
      custom_css: '',
    }
    setBlocks(prev => [...prev, newBlock])
    setSelectedId(newBlock.id)
  }

  function deleteBlock(id: string) {
    const next = blocks.filter(b => b.id !== id)
    setBlocks(next)
    if (selectedId === id) setSelectedId(next[0]?.id ?? null)
  }

  function duplicateBlock(id: string) {
    const original = blocks.find(b => b.id === id)
    if (!original) return
    const idx = blocks.findIndex(b => b.id === id)
    const copy: PageBlock = { ...original, id: makeId() }
    setBlocks(prev => [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)])
    setSelectedId(copy.id)
  }

  function toggleVisible(id: string) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, visible: !b.visible } : b))
  }

  function updateBlock(updated: PageBlock) {
    setBlocks(prev => prev.map(b => b.id === updated.id ? updated : b))
  }

  // ── DnD reorder ───────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setBlocks(prev => {
      const oldIdx = prev.findIndex(b => b.id === active.id)
      const newIdx = prev.findIndex(b => b.id === over.id)
      return arrayMove(prev, oldIdx, newIdx)
    })
  }

  // ── Template ──────────────────────────────────────────────────────────────
  function applyTemplate(templateId: string) {
    const template = PAGE_TEMPLATES.find(t => t.id === templateId)
    if (!template) return
    const newBlocks: PageBlock[] = template.blocks.map((tb, i) => ({
      id: makeId(),
      business_id: business.id,
      type: tb.type,
      sort_order: i,
      visible: true,
      config: {
        ...(getDefaultConfig(tb.type) as unknown as Record<string, unknown>),
        ...(tb.config ?? {}),
      } as PageBlock['config'],
      spacing: { ...defaultSpacing },
      custom_css: '',
    }))
    setBlocks(newBlocks)
    setSelectedId(newBlocks[0]?.id ?? null)
    setShowTemplatePicker(false)
  }

  function handleSelectTemplate(templateId: string) {
    if (blocks.length > 0) {
      setPendingTemplate(templateId)
    } else {
      applyTemplate(templateId)
    }
  }

  // ── Publish ───────────────────────────────────────────────────────────────
  async function handlePublish(state: boolean) {
    setPublishing(true)
    if (state) saveNow() // ensure any pending changes are saved immediately
    try {
      const res = await togglePublishAction(business.id, state)
      if (res.success) {
        setPublished(state)
        setPublishingSettings(res.data)
        if (state) setHasUnpublishedChanges(false)
        toast.success(state ? 'Page published successfully! 🎉' : 'Page unpublished')
      } else {
        toast.error(res.error)
      }
    } catch (err) {
      toast.error('Failed to toggle publish status')
    }
    setPublishing(false)
  }

  const renderLeftSidebarContent = () => (
    <>
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('pageBuilder.sections')}</span>
        <button
          onClick={() => { setShowTemplatePicker(true); setMobileBlocksOpen(false); }}
          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {t('pageBuilder.templates')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col">
        {/* Header / Navbar */}
        <div className="p-1.5 border-b border-border/50">
          <button
            type="button"
            onClick={() => { openNavbarPanel(); setMobileBlocksOpen(false); openMobileSettingsIfNeed(); }}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm font-medium transition-colors text-left',
              activeRightPanel === 'navbar' && !selectedId
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Menu className="size-4 opacity-70" />
            Header
          </button>
        </div>

        {/* Draggable Blocks */}
        <div className="flex-1">
          <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
              <div className="p-1.5 space-y-0.5 min-h-[100px]">
                {blocks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">{t('pageBuilder.noSections')}</p>
                )}
                {blocks.map(block => (
                  <SidebarBlockItem
                    key={block.id}
                    block={block}
                    isSelected={block.id === selectedId}
                    onSelect={() => { setSelectedId(block.id); setMobileBlocksOpen(false); openMobileSettingsIfNeed(); }}
                    onToggleVisible={() => toggleVisible(block.id)}
                    onDuplicate={() => duplicateBlock(block.id)}
                    onDelete={() => deleteBlock(block.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="px-3 pb-3">
            <Button variant="outline" size="sm" className="w-full text-xs h-8" onClick={() => { setAddModalOpen(true); setMobileBlocksOpen(false); }}>
              <Plus className="size-3 mr-1" /> {t('pageBuilder.addSection')}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-1.5 border-y border-border/50">
          <button
            type="button"
            onClick={() => { openFooterPanel(); setMobileBlocksOpen(false); openMobileSettingsIfNeed(); }}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm font-medium transition-colors text-left',
              activeRightPanel === 'footer' && !selectedId
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <PanelBottom className="size-4 opacity-70" />
            Footer
          </button>
        </div>
      </div>

      {/* Page Settings */}
      <div className="p-1.5 bg-background border-t border-border mt-auto shrink-0">
        <button
          type="button"
          onClick={() => { openThemePanel(); setMobileBlocksOpen(false); openMobileSettingsIfNeed(); }}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm font-medium transition-colors text-left',
            activeRightPanel === 'theme' && !selectedId
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <Settings className="size-4" />
          Global Settings
        </button>
      </div>
    </>
  )

  const renderRightSidebarContent = () => (
    <>
      {activeRightPanel === 'block' && selectedBlock ? (
        <>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
            <span className="text-muted-foreground">{blockIcon(selectedBlock.type)}</span>
            <span className="font-semibold text-sm flex-1">{t(`pageBuilder.blocks.${selectedBlock.type}.label`)}</span>
            {!selectedBlock.visible && (
              <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">{t('pageBuilder.hidden')}</Badge>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
              <BlockSettingsPanel block={selectedBlock} business={business} blocks={blocks} categories={categories} items={initialItems} onChange={updateBlock} editLocale={editLocale} />
          </div>
        </>
      ) : activeRightPanel === 'navbar' ? (
        <>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
            <Menu className="size-3.5 text-muted-foreground" />
            <span className="font-semibold text-sm">{t('pageBuilder.navbar')}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <NavbarSettings
              config={navbarConfig}
              businessId={business.id}
              blocks={blocks}
              editLocale={editLocale}
              onChange={updated => setTheme(t => t ? { ...t, navbar_config: updated } : t)}
            />
          </div>
        </>
      ) : activeRightPanel === 'footer' ? (
        <>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
            <PanelBottom className="size-3.5 text-muted-foreground" />
            <span className="font-semibold text-sm">{t('pageBuilder.footer')}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <FooterSettings
              config={footerConfig}
              onChange={updated => setTheme(t => t ? { ...t, footer_config: updated } : t)}
              businessId={business.id}
              editLocale={editLocale}
            />
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
            <Palette className="size-3.5 text-muted-foreground" />
            <span className="font-semibold text-sm">{t('pageBuilder.theme')}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <GlobalSettingsPanel
              theme={theme}
              publishing={publishingSettings}
              onThemeChange={handleThemeChange}
              onPublishingChange={handlePublishingChange}
            />
          </div>
        </>
      )}
    </>
  )

  return (
    // Fix-position overlay covers the full viewport including the dashboard sidebar
    <div className="fixed inset-0 z-50 flex flex-col bg-background">

      {/* Top bar */}
      {isPreviewMode ? (
        <div className="h-12 shrink-0 bg-indigo-600 text-white flex items-center justify-center relative shadow-md z-50">
          <span className="text-sm font-medium tracking-wide flex items-center gap-2">
            <Eye className="size-4 opacity-80" /> {t('pageBuilder.preview')}
          </span>
          {!isStaff && (
            <button
              onClick={() => setIsPreviewMode(false)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-indigo-700 rounded-full transition-colors"
              title={t('pageBuilder.closePreview')}
            >
              <X className="size-5" />
            </button>
          )}
        </div>
      ) : (
        <PublishBar
          businessName={business.name}
          slug={business.slug}
          published={published}
          hasUnpublishedChanges={hasUnpublishedChanges}
          saveStatus={saveStatus}
          onPublish={handlePublish}
          publishing={publishing}
          onSaveNow={saveNow}
          onTogglePreview={() => setIsPreviewMode(true)}
          editLocale={editLocale}
          onEditLocaleChange={setEditLocale}
        />
      )}

      {/* Template picker overlay */}
      {showTemplatePicker && (
        <TemplatePicker
          onSelect={handleSelectTemplate}
          onClose={() => {
            if (blocks.length > 0) setShowTemplatePicker(false)
          }}
          canClose={blocks.length > 0}
        />
      )}

      {/* Confirmation Modal */}
      <Dialog open={!!pendingTemplate} onOpenChange={o => !o && setPendingTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pageBuilder.applyTemplate')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">
            {t('pageBuilder.applyTemplateConfirm')}
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setPendingTemplate(null)}>{t('pageBuilder.cancel')}</Button>
            <Button variant="destructive" onClick={() => {
              if (pendingTemplate) applyTemplate(pendingTemplate)
              setPendingTemplate(null)
            }}>
              {t('pageBuilder.replaceLayout')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 3-column body */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Block list sidebar ──────────────────────────────────────────── */}
        {!isPreviewMode && (
          <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-muted/20">
            {renderLeftSidebarContent()}
          </aside>
        )}

        {/* ── Canvas ─────────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-hidden flex flex-col bg-[#e8e8ed] dark:bg-[#1a1a1f] relative">

          {/* Viewport toggle + desktop zoom */}
          <div className="flex items-center justify-center gap-2 py-2 px-4 border-b border-black/10 dark:border-white/5 bg-[#e8e8ed]/80 dark:bg-[#1a1a1f]/80 flex-wrap">
            <div className="flex items-center bg-white dark:bg-gray-900 rounded-lg p-0.5 gap-0.5 shadow-sm border border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => setViewMode('desktop')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  viewMode === 'desktop' ? 'bg-gray-100 dark:bg-gray-800 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Monitor className="size-3.5" /> {t('pageBuilder.desktop')}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('mobile')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  viewMode === 'mobile' ? 'bg-gray-100 dark:bg-gray-800 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Smartphone className="size-3.5" /> {t('pageBuilder.mobile')}
              </button>
            </div>

            {showDesktopZoomControls && (
              <div className="flex items-center gap-1 bg-white dark:bg-gray-900 rounded-lg px-1 py-0.5 shadow-sm border border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setDesktopZoom(z => Math.max(0.25, Math.round((z - 0.1) * 10) / 10))}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Zoom out"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="text-xs font-medium tabular-nums min-w-[3rem] text-center">
                  {Math.round(displayDesktopZoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setDesktopZoom(z => Math.min(2, Math.round((z + 0.1) * 10) / 10))}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Zoom in"
                >
                  <Plus className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDesktopZoom(1)}
                  className="px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* Canvas scroll — overflow-y-auto (NOT hidden) so sticky navbar works */}
          <div ref={canvasScrollRef} className="flex-1 overflow-y-auto overflow-x-auto pb-16 lg:pb-0">
            <div className="py-6 px-4 min-h-full">
              <CartProvider>
              <div
                className={cn(
                  'mx-auto bg-white shadow-xl transition-all duration-300 relative',
                  viewMode === 'mobile'
                    ? 'w-[375px] rounded-[32px]'
                    : 'rounded-xl',
                  (isPreviewMode || viewMode === 'mobile') && 'overflow-hidden',
                )}
                style={{
                  fontFamily: `'${fontFamily}', sans-serif`,
                  ...(viewMode === 'desktop'
                    ? {
                        width: CANVAS_DESKTOP_WIDTH,
                        maxWidth: 'none',
                        ...(displayDesktopZoom < 1 ? { zoom: displayDesktopZoom } : {}),
                      }
                    : {}),
                  ...(isPreviewMode
                    ? { height: 'min(calc(100dvh - 8.5rem), 860px)' }
                    : {}),
                }}
              >
                {/* Heading font scoped to this canvas frame */}
                <style dangerouslySetInnerHTML={{ __html: `
                  h1, h2, h3, h4, h5, h6 { font-family: '${headingFont}', sans-serif !important; }
                ` }} />

                <div className={cn(isPreviewMode && 'absolute inset-0 overflow-y-auto overflow-x-hidden')}>
                {/* ── PERMANENT NAVBAR always at top ── */}
                <NavbarRender
                  config={navbarConfig}
                  businessName={business.name}
                  logoUrl={business.logo_url ?? undefined}
                  inEditor={!isPreviewMode}
                  isMobilePreview={viewMode === 'mobile'}
                  locale={editLocale}
                />

                {viewMode === 'mobile' && (
                  <div className="flex justify-center py-2.5 bg-black">
                    <div className="w-24 h-1.5 bg-gray-700 rounded-full" />
                  </div>
                )}

                {blocks.length === 0 && (
                  <div className="flex flex-col items-center justify-center min-h-[300px] text-center gap-4 p-8">
                    <div className="text-5xl">🎨</div>
                    <div>
                      <p className="font-semibold text-lg">{t('pageBuilder.canvasEmpty')}</p>
                      <p className="text-sm text-muted-foreground mt-1">{t('pageBuilder.canvasEmptyHint')}</p>
                    </div>
                    {!isStaff && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowTemplatePicker(true)}>✦ {t('pageBuilder.templates')}</Button>
                        <Button size="sm" onClick={() => setAddModalOpen(true)}><Plus className="size-4 mr-1.5" /> {t('pageBuilder.addBlock')}</Button>
                      </div>
                    )}
                  </div>
                )}

                {blocks.map(block => (
                  <div key={block.id} id={block.block_anchor_id ?? `block-${block.id}`}>
                    <LiveBlockCard
                      block={block}
                      isSelected={!isPreviewMode && block.id === selectedId}
                      business={business}
                      menuGridData={menuGridData}
                      previewLayout={canvasPreviewLayout}
                      interactive={isPreviewMode}
                      editLocale={editLocale}
                      onClick={() => { if (!isStaff) { setSelectedId(block.id); setRightPanel('block'); openMobileSettingsIfNeed(); } }}
                    />
                  </div>
                ))}

                {/* ── PERMANENT FOOTER always at bottom ── */}
                <FooterRender
                  config={footerConfig}
                  businessName={business.name}
                  inEditor={!isPreviewMode}
                  locale={editLocale}
                />
                </div>

                {isPreviewMode && (
                  <LiveStoreCart
                    businessId={business.id}
                    paymentSettings={paymentSettings}
                    previewMode
                    contained
                    locale={editLocale}
                  />
                )}
              </div>
              </CartProvider>
            </div>
          </div>
        </main>

        {/* ── Settings panel ──────────────────────────────────────────────── */}
        {!isPreviewMode && (
          <aside className="hidden lg:flex flex-col w-80 shrink-0 border-l border-border bg-background">
            {renderRightSidebarContent()}
          </aside>
        )}

        {/* ── Mobile Action Bar ────────────────────────────────────────────── */}
        {!isPreviewMode && (
        <div className="lg:hidden absolute bottom-0 left-0 right-0 h-14 bg-background border-t border-border flex items-center justify-around z-20 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
          <Drawer open={mobileBlocksOpen} onOpenChange={setMobileBlocksOpen}>
            <DrawerTrigger asChild>
              <button className="flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground hover:text-foreground">
                <Layers className="size-5" />
                <span className="text-[10px] font-medium uppercase tracking-wider">{t('pageBuilder.sections')}</span>
              </button>
            </DrawerTrigger>
            <DrawerContent className="h-[80vh] flex flex-col p-0">
              <VisuallyHidden><DrawerTitle>Sections</DrawerTitle></VisuallyHidden>
              {renderLeftSidebarContent()}
            </DrawerContent>
          </Drawer>

          <div className="w-px h-8 bg-border" />

          <Drawer open={mobileSettingsOpen} onOpenChange={setMobileSettingsOpen}>
            <DrawerTrigger asChild>
              <button className="flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground hover:text-foreground" onClick={() => { if (!selectedId) setRightPanel('theme') }}>
                <Settings className="size-5" />
                <span className="text-[10px] font-medium uppercase tracking-wider">Settings</span>
              </button>
            </DrawerTrigger>
            <DrawerContent className="h-[80vh] flex flex-col p-0">
              <VisuallyHidden><DrawerTitle>Settings</DrawerTitle></VisuallyHidden>
              {renderRightSidebarContent()}
            </DrawerContent>
          </Drawer>
        </div>
        )}
      </div>

      {/* Add block modal */}
      {addModalOpen && (
        <AddBlockModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onAdd={addBlock} />
      )}
    </div>
  )
}
