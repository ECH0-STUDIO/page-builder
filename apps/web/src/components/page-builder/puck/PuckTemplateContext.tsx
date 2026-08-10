'use client'

import { createContext, useContext } from 'react'

export type PuckTemplateActions = {
  openTemplatePicker: () => void
}

export const PuckTemplateContext = createContext<PuckTemplateActions | null>(null)

export function usePuckTemplateActions() {
  return useContext(PuckTemplateContext)
}
