'use client'

import React, { createContext, useContext, ReactNode, useState, useCallback, useMemo } from 'react'
import enDict from './dictionaries/en.json'
import viDict from './dictionaries/vi.json'
import type { SupportedLocale } from './locale'

type Dictionary = any // Or define a strict type based on en.json structure

const FALLBACK_DICTIONARIES: Record<SupportedLocale, Dictionary> = {
  en: enDict,
  vi: viDict,
}

export function createTranslator(dictionary: Dictionary) {
  return (key: string) => {
    const keys = key.split('.')
    let value: unknown = dictionary

    for (const k of keys) {
      if (value == null || typeof value !== 'object' || !(k in (value as Record<string, unknown>))) {
        console.warn(`Translation key not found: ${key}`)
        return key
      }
      value = (value as Record<string, unknown>)[k]
    }

    return value as string
  }
}

interface I18nContextType {
  dictionary: Dictionary
  setDictionary: (d: Dictionary) => void
  resetDictionary: () => void
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ dictionary: initialDictionary, children }: { dictionary: Dictionary, children: ReactNode }) {
  const [dictionary, setDictionary] = useState(initialDictionary)
  const [prevInitial, setPrevInitial] = useState(initialDictionary)

  // Sync state if server dictionary changes
  if (initialDictionary !== prevInitial) {
    setPrevInitial(initialDictionary)
    setDictionary(initialDictionary)
  }

  const resetDictionary = useCallback(() => {
    setDictionary(initialDictionary)
  }, [initialDictionary])

  return (
    <I18nContext.Provider value={{ dictionary, setDictionary, resetDictionary }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(I18nContext)

  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider')
  }

  const { dictionary, setDictionary, resetDictionary } = context
  const t = useMemo(() => createTranslator(dictionary), [dictionary])

  return { t, setDictionary, resetDictionary }
}

/** Safe for live-store render trees where layout provider context may not be available during SSR. */
export function useTranslationWithFallback(fallbackLocale: SupportedLocale = 'vi') {
  const context = useContext(I18nContext)
  const dictionary = context?.dictionary ?? FALLBACK_DICTIONARIES[fallbackLocale]
  const t = useMemo(() => createTranslator(dictionary), [dictionary])

  return {
    t,
    setDictionary: context?.setDictionary ?? (() => {}),
    resetDictionary: context?.resetDictionary ?? (() => {}),
  }
}
