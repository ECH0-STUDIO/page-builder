'use client'

import { createContext, useContext } from 'react'

export type PuckTemplateActions = {
  selectTemplate: (templateId: string) => void
  applyingTemplate: boolean
}

export const PuckTemplateContext = createContext<PuckTemplateActions | null>(null)

export function usePuckTemplateActions() {
  return useContext(PuckTemplateContext)
}
