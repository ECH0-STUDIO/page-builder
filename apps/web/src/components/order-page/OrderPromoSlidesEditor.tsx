'use client'

/**
 * Admin editor for order-page promo carousel slides.
 */

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { uploadImageToStorage } from '@/lib/image-utils'
import { saveOrderPromoSlidesAction } from '@/app/actions/page-builder'
import {
  MAX_ORDER_PROMO_SLIDES,
  type OrderPromoSlide,
} from '@/components/order-page/promo-slides'
import { useTranslation } from '@/i18n/I18nProvider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface OrderPromoSlidesEditorProps {
  businessId: string
  initialSlides: OrderPromoSlide[]
  onSlidesChange?: (slides: OrderPromoSlide[]) => void
  /** Recommended upload pixel size shown as guidance */
  recommendedPx?: string
}

export function OrderPromoSlidesEditor({
  businessId,
  initialSlides,
  onSlidesChange,
  recommendedPx = '1920×1080',
}: OrderPromoSlidesEditorProps) {
  const { t } = useTranslation()
  const [slides, setSlides] = useState<OrderPromoSlide[]>(initialSlides)
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [dirty, setDirty] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function markDirty(next: OrderPromoSlide[]) {
    setSlides(next)
    setDirty(true)
    onSlidesChange?.(next)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (slides.length >= MAX_ORDER_PROMO_SLIDES) {
      toast.error(t('publishing.promoMaxSlides').replace('{{n}}', String(MAX_ORDER_PROMO_SLIDES)))
      return
    }
    setUploading(true)
    try {
      const path = `${businessId}/order-promo-${Date.now()}.jpg`
      const url = await uploadImageToStorage('page-images', path, file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        targetSizeKB: 500,
      })
      markDirty([
        ...slides,
        { id: crypto.randomUUID(), image_url: url, alt: '' },
      ])
      toast.success(t('publishing.promoSlideAdded'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('publishing.promoUploadFailed'))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function removeSlide(id: string) {
    markDirty(slides.filter(s => s.id !== id))
  }

  function moveSlide(id: string, dir: -1 | 1) {
    const idx = slides.findIndex(s => s.id === id)
    if (idx < 0) return
    const nextIdx = idx + dir
    if (nextIdx < 0 || nextIdx >= slides.length) return
    const next = [...slides]
    const [item] = next.splice(idx, 1)
    next.splice(nextIdx, 0, item)
    markDirty(next)
  }

  function setAlt(id: string, alt: string) {
    markDirty(slides.map(s => (s.id === id ? { ...s, alt } : s)))
  }

  function handleSave() {
    startTransition(async () => {
      const res = await saveOrderPromoSlidesAction(businessId, slides)
      if (!res.success) {
        toast.error(res.error)
        return
      }
      setSlides(res.data)
      onSlidesChange?.(res.data)
      setDirty(false)
      toast.success(t('publishing.promoSaved'))
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{t('publishing.promoTitle')}</h2>
          <p className="text-xs text-muted-foreground">{t('publishing.promoHint')}</p>
          <p className="text-[11px] text-muted-foreground/90">
            {t('orderPageAdmin.slideSizeNote').replace('{{px}}', recommendedPx)}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={!dirty || isPending}
          className="shrink-0"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : t('publishing.save')}
        </Button>
      </div>

      {slides.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/50 px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">{t('publishing.promoEmpty')}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {slides.map((slide, index) => (
            <li
              key={slide.id}
              className="flex gap-3 rounded-xl border border-border bg-muted/40 p-3"
            >
              <div className="relative size-16 sm:size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={slide.image_url}
                  alt={slide.alt || `Slide ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <input
                  type="text"
                  value={slide.alt}
                  onChange={e => setAlt(slide.id, e.target.value)}
                  placeholder={t('publishing.promoAltPlaceholder')}
                  className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:border-foreground/40"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveSlide(slide.id, -1)}
                    disabled={index === 0}
                    className={cn(
                      'p-1.5 rounded-lg text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30',
                    )}
                    aria-label={t('publishing.promoMoveUp')}
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSlide(slide.id, 1)}
                    disabled={index === slides.length - 1}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30"
                    aria-label={t('publishing.promoMoveDown')}
                  >
                    <ChevronDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSlide(slide.id)}
                    className="ml-auto p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600"
                    aria-label={t('publishing.promoRemove')}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleUpload}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading || slides.length >= MAX_ORDER_PROMO_SLIDES}
          onClick={() => fileRef.current?.click()}
          className="w-full sm:w-auto"
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <ImagePlus className="size-4 mr-2" />
          )}
          {t('publishing.promoAddSlide')}
          <span className="ml-2 text-xs text-muted-foreground">
            ({slides.length}/{MAX_ORDER_PROMO_SLIDES})
          </span>
        </Button>
      </div>
    </div>
  )
}
