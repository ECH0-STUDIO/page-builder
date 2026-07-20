'use client'

/**
 * Stripped-down Order Page builder — preview canvas + settings panel
 * (mirrors Page Builder chrome, without Puck block editing).
 */

import { useMemo, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  ImagePlus,
  Loader2,
  Monitor,
  Smartphone,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react'
import { toast } from 'sonner'
import { OrderPromoSlidesEditor } from '@/components/order-page/OrderPromoSlidesEditor'
import { OrderMenuConfigEditor } from '@/components/order-page/OrderMenuConfigEditor'
import {
  OrderPagePreview,
  type PreviewDevice,
} from '@/components/order-page/OrderPagePreview'
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
  saveOrderAppearanceAction,
  saveOrderCarouselAspectAction,
} from '@/app/actions/page-builder'
import { uploadImageToStorage } from '@/lib/image-utils'
import type { PublishingSettings, MenuGridConfig } from '@/components/page-builder/types'
import { defaultMenuGridConfig } from '@/components/page-builder/types'
import type { MenuCategory, MenuItem } from '@/app/actions/menu'
import { useTranslation } from '@/i18n/I18nProvider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type SettingsTab = 'appearance' | 'carousel' | 'menu'

interface OrderPageEditorProps {
  businessId: string
  businessName: string
  logoUrl?: string | null
  brandColor: string
  slug: string
  /** Canonical absolute URL for copy */
  orderUrl: string
  /** Same-origin path for open/preview (avoids hitting undeployed production) */
  orderPath: string
  orderPublished: boolean
  publishing: PublishingSettings | null
  categories: MenuCategory[]
  items: MenuItem[]
}

export function OrderPageEditor({
  businessId,
  businessName,
  logoUrl,
  brandColor,
  slug,
  orderUrl,
  orderPath,
  orderPublished,
  publishing,
  categories,
  items,
}: OrderPageEditorProps) {
  const { t } = useTranslation()
  const router = useRouter()

  const [tab, setTab] = useState<SettingsTab>('appearance')
  const [device, setDevice] = useState<PreviewDevice>('desktop')
  const [copied, setCopied] = useState(false)

  const [bgColor, setBgColor] = useState(publishing?.order_background_color ?? '#ffffff')
  const [bgImage, setBgImage] = useState(publishing?.order_background_image_url ?? '')
  const [appearanceDirty, setAppearanceDirty] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [appearancePending, startAppearance] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const [slides, setSlides] = useState<OrderPromoSlide[]>(
    normalizeOrderPromoSlides(publishing?.order_promo_slides),
  )
  const [aspectDesktop, setAspectDesktop] = useState<CarouselAspect>(
    normalizeCarouselAspect(publishing?.order_carousel_aspect_desktop, '16/9'),
  )
  const [aspectMobile, setAspectMobile] = useState<CarouselAspectMobile>(
    normalizeCarouselAspectMobile(publishing?.order_carousel_aspect_mobile ?? 'same'),
  )
  const [aspectDirty, setAspectDirty] = useState(false)
  const [aspectPending, startAspect] = useTransition()

  const [menuConfig, setMenuConfig] = useState<MenuGridConfig>(
    normalizeOrderMenuConfig(publishing?.order_menu_config)
      ?? { ...defaultMenuGridConfig, heading: '', description: '' },
  )

  const previewSlides = useMemo(
    () =>
      resolvePromoSlides({
        configured: slides,
        businessName,
        ogImageUrl: publishing?.og_image_url,
        pageBlocks: [],
        menuItems: items,
      }),
    [slides, businessName, publishing?.og_image_url, items],
  )

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
      setBgImage(url)
      setAppearanceDirty(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('orderPageAdmin.uploadFailed'))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleSaveAppearance() {
    startAppearance(async () => {
      const res = await saveOrderAppearanceAction(businessId, {
        order_background_color: bgColor || null,
        order_background_image_url: bgImage || null,
      })
      if (!res.success) {
        toast.error(res.error)
        return
      }
      setAppearanceDirty(false)
      toast.success(t('orderPageAdmin.appearanceSaved'))
    })
  }

  function handleSaveAspect() {
    startAspect(async () => {
      const res = await saveOrderCarouselAspectAction(businessId, {
        desktop: aspectDesktop,
        mobile: aspectMobile,
      })
      if (!res.success) {
        toast.error(res.error)
        return
      }
      setAspectDesktop(res.data.desktop)
      setAspectMobile(res.data.mobile)
      setAspectDirty(false)
      toast.success(t('orderPageAdmin.aspectSaved'))
    })
  }

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'appearance', label: t('orderPageAdmin.tabAppearance') },
    { id: 'carousel', label: t('orderPageAdmin.tabCarousel') },
    { id: 'menu', label: t('orderPageAdmin.tabMenu') },
  ]

  const desktopGuide = CAROUSEL_ASPECT_GUIDE[aspectDesktop]
  const mobileResolved: CarouselAspect =
    aspectMobile === 'same' ? aspectDesktop : aspectMobile
  const mobileGuide = CAROUSEL_ASPECT_GUIDE[mobileResolved]

  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden bg-background">
      {/* Header — matches page builder chrome */}
      <header className="shrink-0 flex items-center gap-2 h-12 px-3 border-b border-border bg-background z-20">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-accent shrink-0"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline text-xs font-medium">{t('pageBuilder.back')}</span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">
              {t('orderPageAdmin.title')}
            </span>
            <span className="hidden sm:inline text-xs text-muted-foreground truncate">
              /{slug}/order
            </span>
            <span
              className={cn(
                'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                orderPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
              )}
            >
              {orderPublished ? t('orderPageAdmin.live') : t('orderPageAdmin.draft')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center rounded-lg border border-border p-0.5 mr-1">
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                device === 'desktop' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60',
              )}
              title={t('orderPageAdmin.previewDesktop')}
            >
              <Monitor className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                device === 'mobile' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60',
              )}
              title={t('orderPageAdmin.previewMobile')}
            >
              <Smartphone className="size-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            title={t('orderPageAdmin.copyUrl')}
          >
            {copied ? <CheckCircle2 className="size-4 text-green-600" /> : <Copy className="size-4" />}
          </button>

          {orderPublished ? (
            <a
              href={orderPath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ExternalLink className="size-3.5" />
              <span className="hidden md:inline">{t('orderPageAdmin.openLive')}</span>
            </a>
          ) : (
            <Button asChild variant="outline" size="sm" className="h-8 text-xs">
              <Link href="/dashboard/publishing">{t('orderPageAdmin.goPublish')}</Link>
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* Preview canvas */}
        <div className="flex-1 min-h-0 overflow-auto bg-[#eceff3] p-4 md:p-8">
          <div className="flex items-center justify-center gap-2 mb-4 text-xs text-muted-foreground">
            <Eye className="size-3.5" />
            <span>
              {device === 'desktop'
                ? t('orderPageAdmin.previewDesktop')
                : t('orderPageAdmin.previewMobile')}
            </span>
          </div>
          <OrderPagePreview
            device={device}
            businessName={businessName}
            logoUrl={logoUrl}
            brandColor={brandColor}
            bgColor={bgColor}
            bgImage={bgImage}
            slides={previewSlides}
            aspectDesktop={aspectDesktop}
            aspectMobile={aspectMobile}
            menuConfig={menuConfig}
            categories={categories}
            items={items}
            slug={slug}
          />
        </div>

        {/* Settings panel */}
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
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold text-foreground">
                      {t('orderPageAdmin.appearanceTitle')}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {t('orderPageAdmin.appearanceHint')}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveAppearance}
                    disabled={!appearanceDirty || appearancePending}
                  >
                    {appearancePending
                      ? <Loader2 className="size-4 animate-spin" />
                      : t('publishing.save')}
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    {t('orderPageAdmin.bgColor')}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={bgColor || '#ffffff'}
                      onChange={e => { setBgColor(e.target.value); setAppearanceDirty(true) }}
                      className="size-9 rounded-lg border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={e => { setBgColor(e.target.value); setAppearanceDirty(true) }}
                      className="h-9 px-3 rounded-lg border border-border text-sm font-mono w-32"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    {t('orderPageAdmin.bgImage')}
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleBgUpload}
                  />
                  {bgImage ? (
                    <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden bg-muted border border-border">
                      <Image src={bgImage} alt="" fill className="object-cover" sizes="400px" />
                      <button
                        type="button"
                        onClick={() => { setBgImage(''); setAppearanceDirty(true) }}
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
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <h2 className="text-sm font-semibold text-foreground">
                        {t('orderPageAdmin.aspectTitle')}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {t('orderPageAdmin.aspectHint')}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveAspect}
                      disabled={!aspectDirty || aspectPending}
                    >
                      {aspectPending
                        ? <Loader2 className="size-4 animate-spin" />
                        : t('publishing.save')}
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      {t('orderPageAdmin.aspectDesktop')}
                    </label>
                    <select
                      value={aspectDesktop}
                      onChange={e => {
                        setAspectDesktop(normalizeCarouselAspect(e.target.value))
                        setAspectDirty(true)
                      }}
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
                      value={aspectMobile}
                      onChange={e => {
                        const v = e.target.value
                        setAspectMobile(
                          v === 'same'
                            ? 'same'
                            : normalizeCarouselAspect(v),
                        )
                        setAspectDirty(true)
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
                  initialSlides={slides}
                  onSlidesChange={setSlides}
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
                  businessId={businessId}
                  initialConfig={normalizeOrderMenuConfig(publishing?.order_menu_config)}
                  categories={categories}
                  items={items}
                  onConfigChange={setMenuConfig}
                />
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
