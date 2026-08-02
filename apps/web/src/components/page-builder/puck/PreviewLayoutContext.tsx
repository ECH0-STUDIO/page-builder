'use client'

import { createContext, useContext } from 'react'
import type { PreviewLayout } from '../render/preview-layout'

const PreviewLayoutContext = createContext<PreviewLayout>('responsive')

export function PreviewLayoutProvider({
  value,
  children,
}: {
  value: PreviewLayout
  children: React.ReactNode
}) {
  return (
    <PreviewLayoutContext.Provider value={value}>
      {children}
    </PreviewLayoutContext.Provider>
  )
}

export function usePreviewLayout(fallback?: PreviewLayout): PreviewLayout {
  const ctx = useContext(PreviewLayoutContext)
  return fallback ?? ctx
}
