'use client'

/**
 * Promo image carousel for the fixed order page hero.
 * Auto-advances; falls back to a brand-colored panel when no images exist.
 */

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export interface PromoSlide {
  src: string
  alt: string
}

interface OrderPromoCarouselProps {
  slides: PromoSlide[]
  businessName: string
  brandColor: string
}

export function OrderPromoCarousel({ slides, businessName, brandColor }: OrderPromoCarouselProps) {
  const [index, setIndex] = useState(0)
  const hasSlides = slides.length > 0

  useEffect(() => {
    if (slides.length < 2) return
    const id = window.setInterval(() => {
      setIndex(i => (i + 1) % slides.length)
    }, 4500)
    return () => window.clearInterval(id)
  }, [slides.length])

  if (!hasSlides) {
    return (
      <div
        className="relative w-full aspect-[16/9] sm:aspect-[21/9] overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${brandColor} 0%, color-mix(in srgb, ${brandColor} 55%, #111) 100%)`,
        }}
      >
        <div className="absolute inset-0 flex items-end p-5 sm:p-8">
          <p className="text-white text-xl sm:text-2xl font-bold tracking-tight drop-shadow-sm">
            {businessName}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] overflow-hidden bg-gray-100">
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
      )}
    </div>
  )
}
