'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { useTranslation } from '@/i18n/I18nProvider'
import { cn } from '@/lib/utils'

export function OrderScrollTop({ brandColor }: { brandColor: string }) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 420)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label={t('orderPage.scrollTop')}
      className={cn(
        'fixed right-4 z-[45] size-11 rounded-full shadow-lg flex items-center justify-center text-white transition-all',
        'bottom-36 sm:bottom-36',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none',
      )}
      style={{ backgroundColor: brandColor }}
    >
      <ArrowUp className="size-5" />
    </button>
  )
}
