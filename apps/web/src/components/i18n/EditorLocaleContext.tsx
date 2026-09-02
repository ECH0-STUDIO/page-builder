'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { SupportedLocale } from '@/i18n/locale'
import { LOCALE_LABELS, toSupportedLocale } from '@/i18n/locale'
import { otherStoreLocale } from '@/i18n/localized-content'
import type { StoreLanguageConfig } from '@/i18n/store-locale'

export interface EditorLocaleContextValue {
  contentLocale: SupportedLocale
  primaryLocale: SupportedLocale
  secondaryLocale: SupportedLocale
  dualEnabled: boolean
  /** True when editing secondary locale in page/order builder (layout locked). */
  secondaryLocked: boolean
  setContentLocale: (locale: SupportedLocale) => void
}

const EditorLocaleContext = createContext<EditorLocaleContextValue | null>(null)

export function EditorLocaleProvider({
  storeLanguage,
  children,
  /** Menu builder uses independent VI|EN tabs — never locks layout. */
  lockSecondary = true,
}: {
  storeLanguage: StoreLanguageConfig
  children: ReactNode
  lockSecondary?: boolean
}) {
  const primaryLocale = storeLanguage.primary_locale
  const secondaryLocale = storeLanguage.secondary_locale
  const dualEnabled = storeLanguage.dual_language_enabled
  const [contentLocale, setContentLocale] = useState<SupportedLocale>(primaryLocale)

  const value = useMemo<EditorLocaleContextValue>(() => {
    const locale = dualEnabled ? contentLocale : primaryLocale
    const secondaryLocked =
      lockSecondary && dualEnabled && locale !== primaryLocale
    return {
      contentLocale: locale,
      primaryLocale,
      secondaryLocale,
      dualEnabled,
      secondaryLocked,
      setContentLocale: dualEnabled ? setContentLocale : () => {},
    }
  }, [
    contentLocale,
    dualEnabled,
    lockSecondary,
    primaryLocale,
    secondaryLocale,
  ])

  return (
    <EditorLocaleContext.Provider value={value}>{children}</EditorLocaleContext.Provider>
  )
}

export function useEditorLocale(): EditorLocaleContextValue {
  const ctx = useContext(EditorLocaleContext)
  if (!ctx) {
    const primary: SupportedLocale = 'vi'
    return {
      contentLocale: primary,
      primaryLocale: primary,
      secondaryLocale: otherStoreLocale(primary),
      dualEnabled: false,
      secondaryLocked: false,
      setContentLocale: () => {},
    }
  }
  return ctx
}

export function localeTabLabel(locale: SupportedLocale): string {
  return LOCALE_LABELS[toSupportedLocale(locale)]
}
