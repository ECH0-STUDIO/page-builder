'use client'

/**
 * Dedicated Order Page admin — appearance, carousel, and menu.
 * (Publish toggles stay on the Publishing page.)
 */

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  CheckCircle2, Copy, ExternalLink, ImagePlus, Loader2, Trash2, UtensilsCrossed,
} from 'lucide-react'
import { toast } from 'sonner'
import { OrderPromoSlidesEditor } from '@/components/order-page/OrderPromoSlidesEditor'
import { OrderMenuConfigEditor } from '@/components/order-page/OrderMenuConfigEditor'
import { normalizeOrderPromoSlides } from '@/components/order-page/promo-slides'
import { normalizeOrderMenuConfig } from '@/components/order-page/order-menu-config'
import { saveOrderAppearanceAction } from '@/app/actions/page-builder'
import { uploadImageToStorage } from '@/lib/image-utils'
import type { PublishingSettings } from '@/components/page-builder/types'
import type { MenuCategory, MenuItem } from '@/app/actions/menu'
import { useTranslation } from '@/i18n/I18nProvider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface OrderPageEditorProps {
  businessId: string
  slug: string
  orderUrl: string
  orderPublished: boolean
  publishing: PublishingSettings | null
  categories: MenuCategory[]
  items: MenuItem[]
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm p-6', className)}>
      {children}
    </div>
  )
}

export function OrderPageEditor({
  businessId,
  slug,
  orderUrl,
  orderPublished,
  publishing,
  categories,
  items,
}: OrderPageEditorProps) {
  const { t } = useTranslation()
  const [bgColor, setBgColor] = useState(publishing?.order_background_color ?? '#ffffff')
  const [bgImage, setBgImage] = useState(publishing?.order_background_image_url ?? '')
  const [dirty, setDirty] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

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
      setDirty(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('orderPageAdmin.uploadFailed'))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleSaveAppearance() {
    startTransition(async () => {
      const res = await saveOrderAppearanceAction(businessId, {
        order_background_color: bgColor || null,
        order_background_image_url: bgImage || null,
      })
      if (!res.success) {
        toast.error(res.error)
        return
      }
      setDirty(false)
      toast.success(t('orderPageAdmin.appearanceSaved'))
    })
  }

  return (
    <div className="space-y-6">
      {/* Live URL */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">{t('orderPageAdmin.liveUrl')}</h2>
              <span
                className={cn(
                  'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                  orderPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
                )}
              >
                {orderPublished ? t('orderPageAdmin.live') : t('orderPageAdmin.draft')}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {orderPublished
                ? t('orderPageAdmin.liveHint')
                : t('orderPageAdmin.draftHint')}
            </p>
          </div>
          {!orderPublished && (
            <Button asChild variant="outline" className="shrink-0">
              <Link href="/dashboard/publishing">{t('orderPageAdmin.goPublish')}</Link>
            </Button>
          )}
        </div>
        <div className="mt-4 flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
          <span className="flex-1 text-sm text-gray-700 truncate font-mono">{orderUrl}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 text-gray-500"
          >
            {copied ? <CheckCircle2 className="size-4 text-green-600" /> : <Copy className="size-4" />}
          </button>
          {orderPublished ? (
            <a
              href={orderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 text-gray-500"
            >
              <ExternalLink className="size-4" />
            </a>
          ) : (
            <span className="shrink-0 p-1.5 text-gray-300">
              <ExternalLink className="size-4" />
            </span>
          )}
        </div>
      </Card>

      {/* Appearance */}
      <Card>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="space-y-1">
            <h2 className="font-semibold text-gray-900">{t('orderPageAdmin.appearanceTitle')}</h2>
            <p className="text-sm text-gray-500">{t('orderPageAdmin.appearanceHint')}</p>
          </div>
          <Button type="button" onClick={handleSaveAppearance} disabled={!dirty || isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : t('publishing.save')}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t('orderPageAdmin.bgColor')}</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={bgColor || '#ffffff'}
                onChange={e => { setBgColor(e.target.value); setDirty(true) }}
                className="size-10 rounded-lg border border-gray-200 cursor-pointer"
              />
              <input
                type="text"
                value={bgColor}
                onChange={e => { setBgColor(e.target.value); setDirty(true) }}
                className="h-10 px-3 rounded-xl border border-gray-200 text-sm font-mono w-36"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">{t('orderPageAdmin.bgImage')}</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleBgUpload}
            />
            {bgImage ? (
              <div className="relative w-full max-w-md aspect-[21/9] rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                <Image src={bgImage} alt="" fill className="object-cover" sizes="480px" />
                <button
                  type="button"
                  onClick={() => { setBgImage(''); setDirty(true) }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? <Loader2 className="size-4 animate-spin mr-2" /> : <ImagePlus className="size-4 mr-2" />}
                {t('orderPageAdmin.uploadBg')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Carousel */}
      <Card>
        <OrderPromoSlidesEditor
          businessId={businessId}
          initialSlides={normalizeOrderPromoSlides(publishing?.order_promo_slides)}
        />
      </Card>

      {/* Menu */}
      <Card>
        <div className="flex items-center gap-2 mb-1">
          <UtensilsCrossed className="size-4 text-gray-600" />
        </div>
        <OrderMenuConfigEditor
          businessId={businessId}
          initialConfig={normalizeOrderMenuConfig(publishing?.order_menu_config)}
          categories={categories}
          items={items}
        />
      </Card>

      <p className="text-xs text-gray-400 text-center pb-4">
        {t('orderPageAdmin.slugNote').replace('{{slug}}', slug)}
      </p>
    </div>
  )
}
