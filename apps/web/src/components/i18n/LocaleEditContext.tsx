'use client'

import { createContext, useContext } from 'react'
import { DEFAULT_ENABLED_LOCALES } from '@/i18n/locale-content'

export interface LocaleEditContextValue {
  editLocale: string
  enabledLocales: string[]
  primaryLocale: string
}

const LocaleEditContext = createContext<LocaleEditContextValue>({
  editLocale: 'vi',
  enabledLocales: [...DEFAULT_ENABLED_LOCALES],
  primaryLocale: 'vi',
})

export function LocaleEditProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: LocaleEditContextValue
}) {
  return (
    <LocaleEditContext.Provider value={value}>
      {children}
    </LocaleEditContext.Provider>
  )
}

export function useLocaleEdit(): LocaleEditContextValue {
  return useContext(LocaleEditContext)
}
