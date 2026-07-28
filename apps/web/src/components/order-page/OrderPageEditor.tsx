'use client'

/**
 * Order Page builder — preview canvas + settings with page-builder-style
 * autosave, undo/redo, and in-editor publish.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  ExternalLink,
  Eye,
  ImagePlus,
  Loader2,
  Redo2,
  Trash2,
  Undo2,
  UtensilsCrossed,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  OrderPromoSlidesEditor,
} from '@/components/order-page/OrderPromoSlidesEditor'
import {
  OrderMenuConfigEditor,
  defaultOrderMenuConfig,
} from '@/components/order-page/OrderMenuConfigEditor'
import { OrderPagePreview } from '@/components/order-page/OrderPagePreview'
import { resolvePromoSlides } from '@/components/order-page/buildPromoSlides'
import {
  CAROUSEL_ASPECTS,
  CAROUSEL_ASPECT_GUIDE,
  normalizeCarouselAspect,
  normalizeCarouselAspectMobile,
  normalizeOrderPromoSlides,
  type CarouselAspect,
  type CarouselAspectMobile,
  type OrderPromoSlide,
} from '@/components/order-page/promo-slides'
import { normalizeOrderMenuConfig } from '@/components/order-page/order-menu-config'
import {
  saveOrderPageDraftAction,
  saveThemeAction,
  togglePublishAction,
} from '@/app/actions/page-builder'
import { uploadImageToStorage } from '@/lib/image-utils'
import {
  defaultThemeSettings,
  type PublishingSettings,
  type MenuGridConfig,
  type ThemeSettings,
} from '@/components/page-builder/types'
import type { SaveStatus } from '@/components/page-builder/PublishBar'
import type { MenuCategory, MenuItem } from '@/app/actions/menu'
import { useTranslation } from '@/i18n/I18nProvider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeAppearanceFields } from '@/components/shared/ThemeAppearanceFields'
import { ColorSwatchField } from '@/components/shared/ColorSwatchField'
import {
  PageBuilderModeSwitcher,
  type BuilderPageMode,
} from '@/components/page-builder/PageBuilderModeSwitcher'
import { cn } from '@/lib/utils'

type SettingsTab = 'appearance' | 'carousel' | 'menu'

interface OrderDraft {
  bgColor: string
  bgImage: string
  brandColor: string
  headingFont: string
  bodyFont: string
  themeBgColor: string
  themeTextColor: string
  slides: OrderPromoSlide[]
  aspectDesktop: CarouselAspect
  aspectMobile: CarouselAspectMobile
  /** null = using landing defaults */
  menuConfig: MenuGridConfig | null
}

const MAX_UNDO = 40
const AUTOSAVE_MS = 1500
const HISTORY_BURST_MS = 800

interface OrderPageEditorProps {
  businessId: string
  businessName: string
  logoUrl?: string | null
  slug: string
  /** Canonical absolute URL for copy */
  orderUrl: string
  /** Same-origin path for open/preview (avoids hitting undeployed production) */
  orderPath: string
  orderPublished: boolean
  publishing: PublishingSettings | null
  initialTheme: Partial<ThemeSettings> | null
  categories: MenuCategory[]
  items: MenuItem[]
  /** Unified builder mode — shows Landing | Order switcher when set */
  builderMode?: BuilderPageMode
}

function draftFromSources(
  publishing: PublishingSettings | null,
  theme: Partial<ThemeSettings> | null,
): OrderDraft {
  return {
    bgColor: publishing?.order_background_color ?? '#ffffff',
    bgImage: publishing?.order_background_image_url ?? '',
    brandColor: theme?.primary_color || defaultThemeSettings.primary_color,
    headingFont: theme?.heading_font_family || defaultThemeSettings.heading_font_family || 'Inter',
    bodyFont: theme?.font_family || defaultThemeSettings.font_family || 'Inter',
    themeBgColor: theme?.background_color || defaultThemeSettings.background_color,
    themeTextColor: theme?.text_color || defaultThemeSettings.text_color,
    slides: normalizeOrderPromoSlides(publishing?.order_promo_slides),
    aspectDesktop: normalizeCarouselAspect(publishing?.order_carousel_aspect_desktop, '16/9'),
    aspectMobile: normalizeCarouselAspectMobile(publishing?.order_carousel_aspect_mobile ?? 'same'),
    menuConfig: normalizeOrderMenuConfig(publishing?.order_menu_config),
  }
}

function cloneDraft(d: OrderDraft): OrderDraft {
  return {
    bgColor: d.bgColor,
    bgImage: d.bgImage,
    brandColor: d.brandColor,
    headingFont: d.headingFont,
    bodyFont: d.bodyFont,
    themeBgColor: d.themeBgColor,
    themeTextColor: d.themeTextColor,
    slides: d.slides.map(s => ({ ...s })),
    aspectDesktop: d.aspectDesktop,
    aspectMobile: d.aspectMobile,
    menuConfig: d.menuConfig ? { ...d.menuConfig } : null,
  }
}

export function OrderPageEditor({
  businessId,
  businessName,
  logoUrl,
  slug,
  orderUrl,
  orderPath,
  orderPublished: initialPublished,
  publishing,
  initialTheme,
  categories,
  items,
  builderMode = 'order',
}: OrderPageEditorProps) {
  const { t } = useTranslation()
  const router = useRouter()

  const [tab, setTab] = useState<SettingsTab>('appearance')
  const [copied, setCopied] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [published, setPublished] = useState(initialPublished)
  const [publishingBusy, setPublishingBusy] = useState(false)
  const [draft, setDraft] = useState<OrderDraft>(() => draftFromSources(publishing, initialTheme))
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const draftRef = useRef(draft)
  draftRef.current = draft
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const historyBurstTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const undoStack = useRef<OrderDraft[]>([])
  const redoStack = useRef<OrderDraft[]>([])
  const skipHistory = useRef(false)
  const isFirstSave = useRef(true)

  const baseMenuConfig = draft.menuConfig ?? defaultOrderMenuConfig()
  // Appearance text colour drives category chrome; card text stays dark on white cards.
  const previewMenuConfig: MenuGridConfig = {
    ...baseMenuConfig,
    text_color: draft.themeTextColor || '#111111',
  }

  const previewSlides = useMemo(
    () =>
      resolvePromoSlides({
        configured: draft.slides,
        businessName,
      }),
    [draft.slides, businessName],
  )

  const scheduleSave = useCallback(() => {
    setSaveStatus('idle')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const current = draftRef.current
      setSaveStatus('saving')
      const [orderRes, themeRes] = await Promise.all([
        saveOrderPageDraftAction(businessId, {
          order_background_color: current.bgColor || null,
          order_background_image_url: current.bgImage || null,
          order_promo_slides: current.slides,
          order_carousel_aspect_desktop: current.aspectDesktop,
          order_carousel_aspect_mobile: current.aspectMobile,
          order_menu_config: current.menuConfig,
        }),
        saveThemeAction(businessId, {
          primary_color: current.brandColor,
          background_color: current.themeBgColor,
          text_color: current.themeTextColor,
          font_family: current.bodyFont,
          heading_font_family: current.headingFont,
        }),
      ])
      if (!orderRes.success) {
        toast.error(orderRes.error)
        setSaveStatus('idle')
        return
      }
      if (!themeRes.success) {
        toast.error(themeRes.error)
        setSaveStatus('idle')
        return
      }
      setSaveStatus('saved')
    }, AUTOSAVE_MS)
  }, [businessId])

  const pushHistory = useCallback(() => {
    if (skipHistory.current) return
    undoStack.current = [
      ...undoStack.current.slice(-(MAX_UNDO - 1)),
      cloneDraft(draftRef.current),
    ]
    redoStack.current = []
    setCanUndo(undoStack.current.length > 0)
    setCanRedo(false)
  }, [])

  const markHistory = useCallback(() => {
    if (skipHistory.current) return
    if (!historyBurstTimer.current) {
      pushHistory()
    }
    if (historyBurstTimer.current) clearTimeout(historyBurstTimer.current)
    historyBurstTimer.current = setTimeout(() => {
      historyBurstTimer.current = null
    }, HISTORY_BURST_MS)
  }, [pushHistory])

  const updateDraft = useCallback(
    (updater: (prev: OrderDraft) => OrderDraft) => {
      markHistory()
      setDraft(prev => {
        const next = updater(prev)
        draftRef.current = next
        return next
      })
      scheduleSave()
    },
    [markHistory, scheduleSave],
  )

  const applySnapshot = useCallback((snap: OrderDraft) => {
    skipHistory.current = true
    const next = cloneDraft(snap)
    draftRef.current = next
    setDraft(next)
    skipHistory.current = false
    scheduleSave()
  }, [scheduleSave])

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) {
      toast.info(t('pageBuilder.nothingToUndo'))
      return
    }
    redoStack.current.push(cloneDraft(draftRef.current))
    const prev = undoStack.current.pop()!
    applySnapshot(prev)
    setCanUndo(undoStack.current.length > 0)
    setCanRedo(true)
  }, [applySnapshot, t])

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) {
      toast.info(t('pageBuilder.nothingToRedo'))
      return
    }
    undoStack.current.push(cloneDraft(draftRef.current))
    const next = redoStack.current.pop()!
    applySnapshot(next)
    setCanUndo(true)
    setCanRedo(redoStack.current.length > 0)
  }, [applySnapshot, t])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      const key = e.key.toLowerCase()
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      if (historyBurstTimer.current) clearTimeout(historyBurstTimer.current)
    }
  }, [])

  // Flush pending save on unmount / leave
  useEffect(() => {
    if (isFirstSave.current) {
      isFirstSave.current = false
    }
  }, [])

  function handleCopy() {
    navigator.clipboard.writeText(orderUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const path = `${businessId}/order-bg-${Date.now()}.jpg`
      const url = await uploadImageToStorage('page-images', path, file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        targetSizeKB: 600,
      })
      updateDraft(d => ({ ...d, bgImage: url }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('orderPageAdmin.uploadFailed'))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handlePublish(next: boolean) {
    // Flush pending autosave before toggling publish
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
      setSaveStatus('saving')
      const current = draftRef.current
      const [saveRes, themeRes] = await Promise.all([
        saveOrderPageDraftAction(businessId, {
          order_background_color: current.bgColor || null,
          order_background_image_url: current.bgImage || null,
          order_promo_slides: current.slides,
          order_carousel_aspect_desktop: current.aspectDesktop,
          order_carousel_aspect_mobile: current.aspectMobile,
          order_menu_config: current.menuConfig,
        }),
        saveThemeAction(businessId, {
          primary_color: current.brandColor,
          background_color: current.themeBgColor,
          text_color: current.themeTextColor,
          font_family: current.bodyFont,
          heading_font_family: current.headingFont,
        }),
      ])
      if (!saveRes.success) {
        toast.error(saveRes.error)
        setSaveStatus('idle')
        return
      }
      if (!themeRes.success) {
        toast.error(themeRes.error)
        setSaveStatus('idle')
        return
      }
      setSaveStatus('saved')
    }

    setPublishingBusy(true)
    const res = await togglePublishAction(businessId, next, 'order')
    setPublishingBusy(false)
    if (!res.success) {
      toast.error(res.error)
      return
    }
    setPublished(next)
    toast.success(next ? t('orderPageAdmin.live') : t('orderPageAdmin.draft'))
  }

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'appearance', label: t('orderPageAdmin.tabAppearance') },
    { id: 'carousel', label: t('orderPageAdmin.tabCarousel') },
    { id: 'menu', label: t('orderPageAdmin.tabMenu') },
  ]

  const desktopGuide = CAROUSEL_ASPECT_GUIDE[draft.aspectDesktop]
  const mobileResolved: CarouselAspect =
    draft.aspectMobile === 'same' ? draft.aspectDesktop : draft.aspectMobile
  const mobileGuide = CAROUSEL_ASPECT_GUIDE[mobileResolved]

  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden bg-background">
      <header className="shrink-0 flex items-center gap-1.5 sm:gap-2 min-h-12 py-1.5 px-2 sm:px-3 border-b border-border bg-background z-20 overflow-x-auto">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-accent shrink-0"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline text-xs font-medium">{t('pageBuilder.back')}</span>
        </button>

        <PageBuilderModeSwitcher mode={builderMode} />

        <div className="min-w-0 flex-1" />

        <div className="flex items-center gap-1 shrink-0">
          <div className="hidden sm:flex items-center gap-0.5 mr-1">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
              title={t('orders.undo')}
            >
              <Undo2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30"
              title="Redo"
            >
              <Redo2 className="size-4" />
            </button>
          </div>

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

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            title={t('orderPageAdmin.copyUrl')}
          >
            {copied ? <CheckCircle2 className="size-4 text-green-600" /> : <Copy className="size-4" />}
          </button>

          {published && (
            <a
              href={orderPath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              title={t('orderPageAdmin.openLive')}
              aria-label={t('orderPageAdmin.openLive')}
            >
              <ExternalLink className="size-4" />
            </a>
          )}

          <Badge
            variant="outline"
            className={cn(
              'text-xs shrink-0 hidden sm:flex items-center gap-1.5 pl-2',
              published
                ? 'border-green-500/40 bg-green-50 text-green-700'
                : 'border-border text-muted-foreground',
            )}
          >
            {published ? (
              <>
                <span className="size-1.5 rounded-full bg-green-600 shrink-0" aria-hidden />
                {t('pageBuilder.live')}
              </>
            ) : (
              t('pageBuilder.draft')
            )}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs"
                disabled={publishingBusy}
              >
                {publishingBusy ? (
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                ) : null}
                {t('pageBuilder.publish')}
                <ChevronDown className="size-3.5 ml-1 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handlePublish(true)}>
                {t('pageBuilder.publishToLive')}
              </DropdownMenuItem>
              {published && (
                <DropdownMenuItem onClick={() => handlePublish(false)}>
                  {t('pageBuilder.saveAsDraft')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <div className="flex-1 min-h-0 overflow-auto bg-[#eceff3] p-4 md:p-8">
          <div className="flex items-center justify-center gap-2 mb-4 text-xs text-muted-foreground">
            <Eye className="size-3.5" />
            <span>{t('orderPageAdmin.previewMobile')}</span>
          </div>
          <OrderPagePreview
            businessName={businessName}
            logoUrl={logoUrl}
            brandColor={draft.brandColor}
            bgColor={draft.bgColor}
            bgImage={draft.bgImage}
            headingFont={draft.headingFont}
            bodyFont={draft.bodyFont}
            slides={previewSlides}
            aspectDesktop={draft.aspectDesktop}
            aspectMobile={draft.aspectMobile}
            menuConfig={previewMenuConfig}
            categories={categories}
            items={items}
            slug={slug}
          />
        </div>

        <aside className="shrink-0 w-full lg:w-[380px] xl:w-[420px] border-t lg:border-t-0 lg:border-l border-border bg-background flex flex-col max-h-[45vh] lg:max-h-none">
          <div className="flex border-b border-border shrink-0">
            {tabs.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  'flex-1 px-2 py-3 text-xs font-semibold transition-colors',
                  tab === item.id
                    ? 'text-foreground border-b-2 border-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {tab === 'appearance' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-foreground">
                    {t('orderPageAdmin.appearanceTitle')}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {t('orderPageAdmin.appearanceHint')}
                  </p>
                </div>

                {/* Shared with landing Global Settings — brand / text / fonts */}
                <ThemeAppearanceFields
                  values={{
                    brandColor: draft.brandColor || '#E85D26',
                    textColor: draft.themeTextColor || '#111111',
                    headingFont: draft.headingFont || 'Inter',
                    bodyFont: draft.bodyFont || 'Inter',
                  }}
                  textColorHint={t('orderPageAdmin.textColorHint')}
                  onChange={patch =>
                    updateDraft(d => ({
                      ...d,
                      ...(patch.brandColor != null ? { brandColor: patch.brandColor } : {}),
                      ...(patch.textColor != null ? { themeTextColor: patch.textColor } : {}),
                      ...(patch.headingFont != null ? { headingFont: patch.headingFont } : {}),
                      ...(patch.bodyFont != null ? { bodyFont: patch.bodyFont } : {}),
                    }))
                  }
                />

                {/* Order-page-only background (not theme background) */}
                <div className="space-y-3 border-t border-border pt-4">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('orderPageAdmin.pageBackground')}
                  </Label>
                  <ColorSwatchField
                    label={t('orderPageAdmin.bgColor')}
                    value={draft.bgColor || '#ffffff'}
                    fallback="#ffffff"
                    onChange={v => updateDraft(d => ({ ...d, bgColor: v }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">{t('orderPageAdmin.bgImage')}</Label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleBgUpload}
                  />
                  {draft.bgImage ? (
                    <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden bg-muted border border-border">
                      <Image src={draft.bgImage} alt="" fill className="object-cover" sizes="400px" />
                      <button
                        type="button"
                        onClick={() => updateDraft(d => ({ ...d, bgImage: '' }))}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploading}
                      onClick={() => fileRef.current?.click()}
                    >
                      {uploading
                        ? <Loader2 className="size-4 animate-spin mr-2" />
                        : <ImagePlus className="size-4 mr-2" />}
                      {t('orderPageAdmin.uploadBg')}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {tab === 'carousel' && (
              <div className="space-y-6">
                <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-3">
                  <div className="space-y-1 min-w-0">
                    <h2 className="text-sm font-semibold text-foreground">
                      {t('orderPageAdmin.aspectTitle')}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {t('orderPageAdmin.aspectHint')}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      {t('orderPageAdmin.aspectDesktop')}
                    </label>
                    <select
                      value={draft.aspectDesktop}
                      onChange={e =>
                        updateDraft(d => ({
                          ...d,
                          aspectDesktop: normalizeCarouselAspect(e.target.value),
                        }))
                      }
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm"
                    >
                      {CAROUSEL_ASPECTS.map(ratio => (
                        <option key={ratio} value={ratio}>
                          {CAROUSEL_ASPECT_GUIDE[ratio].label} ({CAROUSEL_ASPECT_GUIDE[ratio].px})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      {t('orderPageAdmin.aspectMobile')}
                    </label>
                    <select
                      value={draft.aspectMobile}
                      onChange={e => {
                        const v = e.target.value
                        updateDraft(d => ({
                          ...d,
                          aspectMobile: v === 'same' ? 'same' : normalizeCarouselAspect(v),
                        }))
                      }}
                      className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm"
                    >
                      <option value="same">
                        {t('orderPageAdmin.aspectSameAsDesktop')} ({desktopGuide.label})
                      </option>
                      {CAROUSEL_ASPECTS.map(ratio => (
                        <option key={ratio} value={ratio}>
                          {CAROUSEL_ASPECT_GUIDE[ratio].label} ({CAROUSEL_ASPECT_GUIDE[ratio].px})
                        </option>
                      ))}
                    </select>
                  </div>

                  <p className="text-[11px] leading-relaxed text-muted-foreground border-t border-border/80 pt-2">
                    {t('orderPageAdmin.aspectGuide')
                      .replace('{{desktop}}', `${desktopGuide.label} · ${desktopGuide.px}`)
                      .replace('{{mobile}}', `${mobileGuide.label} · ${mobileGuide.px}`)}
                  </p>
                </div>

                <OrderPromoSlidesEditor
                  businessId={businessId}
                  slides={draft.slides}
                  onChange={slides => updateDraft(d => ({ ...d, slides }))}
                  recommendedPx={desktopGuide.px}
                />
              </div>
            )}

            {tab === 'menu' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UtensilsCrossed className="size-4" />
                  <span className="text-xs font-medium">{t('publishing.orderMenuTitle')}</span>
                </div>
                <OrderMenuConfigEditor
                  config={baseMenuConfig}
                  isCustomized={draft.menuConfig != null}
                  categories={categories}
                  items={items}
                  onChange={config => updateDraft(d => ({ ...d, menuConfig: config }))}
                  onReset={() => updateDraft(d => ({ ...d, menuConfig: null }))}
                />
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
