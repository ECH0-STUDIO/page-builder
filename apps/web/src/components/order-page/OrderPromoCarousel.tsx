'use client'

/**
 * Promo image carousel for the fixed order page hero.
 * Only shows admin-configured slides — never auto-fills from menu/OG.
 */

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  aspectClass,
  type CarouselAspect,
  type CarouselAspectMobile,
} from './promo-slides'
import { useTranslation } from '@/i18n/I18nProvider'

export interface PromoSlide {
  src: string
  alt: string
}

const AUTOPLAY_MS = 8000

interface OrderPromoCarouselProps {
  slides: PromoSlide[]
  businessName: string
  brandColor: string
  aspectDesktop?: CarouselAspect
  aspectMobile?: CarouselAspectMobile
  /** When set, ignore responsive breakpoints and use this single aspect (preview canvas). */
  forceAspect?: CarouselAspect
  /** Show admin empty-state hint (dashboard preview). */
  showEmptyHint?: boolean
}

export function OrderPromoCarousel({
  slides,
  businessName,
  brandColor,
  aspectDesktop = '16/9',
  aspectMobile = 'same',
  forceAspect,
  showEmptyHint = false,
}: OrderPromoCarouselProps) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const hasSlides = slides.length > 0
  const mobileAspect: CarouselAspect = aspectMobile === 'same' ? aspectDesktop : aspectMobile
  const frameClass = forceAspect
    ? cn('relative w-full overflow-hidden', aspectClass(forceAspect))
    : cn(
        'relative w-full overflow-hidden',
        aspectClass(mobileAspect),
        aspectDesktop === '21/9' && 'sm:aspect-[21/9]',
        aspectDesktop === '16/9' && 'sm:aspect-video',
        aspectDesktop === '4/3' && 'sm:aspect-[4/3]',
        aspectDesktop === '1/1' && 'sm:aspect-square',
      )

  useEffect(() => {
    setIndex(0)
  }, [slides.length])

  useEffect(() => {
    if (slides.length < 2) return
    const id = window.setInterval(() => {
      setIndex(i => (i + 1) % slides.length)
    }, AUTOPLAY_MS)
    return () => window.clearInterval(id)
  }, [slides.length])

  function go(delta: number) {
    if (slides.length < 2) return
    setIndex(i => (i + delta + slides.length) % slides.length)
  }

  if (!hasSlides) {
    return (
      <div
        className={cn(frameClass, 'bg-gray-100 border-b border-black/5')}
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${brandColor} 12%, #f3f4f6) 0%, #f3f4f6 100%)`,
        }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <ImageIcon className="size-8 text-gray-400" />
          {showEmptyHint ? (
            <p className="text-sm text-gray-500 max-w-sm">
              {t('orderPageAdmin.carouselEmptyHint')}
            </p>
          ) : (
            <p className="text-sm font-medium text-gray-500">{businessName}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(frameClass, 'bg-gray-100 group')}>
      {slides.map((slide, i) => (
        <div
          key={`${slide.src}-${i}`}
          className={cn(
            'absolute inset-0 transition-opacity duration-700 ease-out',
            i === index ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden={i !== index}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={i === 0}
            className="object-cover"
            sizes="(max-width: 1440px) 100vw, 1440px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label={t('orderPage.carouselPrev')}
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-10 size-9 sm:size-10 rounded-full bg-black/35 text-white backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label={t('orderPage.carouselNext')}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 size-9 sm:size-10 rounded-full bg-black/35 text-white backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80',
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
