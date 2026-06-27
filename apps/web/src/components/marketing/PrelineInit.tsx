'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export function PrelineInit() {
  const pathname = usePathname()

  useEffect(() => {
    void import('preline/non-auto').then(({ HSStaticMethods }) => {
      HSStaticMethods.autoInit()
    })
  }, [pathname])

  return null
}
