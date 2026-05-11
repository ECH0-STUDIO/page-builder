'use client'

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react'

type Dictionary = any // Or define a strict type based on en.json structure

interface I18nContextType {
  dictionary: Dictionary
  setDictionary: (d: Dictionary) => void
  resetDictionary: () => void
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ dictionary: initialDictionary, children }: { dictionary: Dictionary, children: ReactNode }) {
  const [dictionary, setDictionary] = useState(initialDictionary)

  // Sync state if server dictionary changes
  useEffect(() => {
    setDictionary(initialDictionary)
  }, [initialDictionary])

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

  // A simple t() function to retrieve nested keys like "settings.security.title"
  const t = (key: string) => {
    const keys = key.split('.')
    let value = dictionary
    
    for (const k of keys) {
      if (value[k] === undefined) {
        console.warn(`Translation key not found: ${key}`)
        return key
      }
      value = value[k]
    }
    
    return value
  }

  return { t, setDictionary, resetDictionary }
}
