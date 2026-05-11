'use client'

import React, { createContext, useContext, ReactNode } from 'react'

type Dictionary = any // Or define a strict type based on en.json structure

const I18nContext = createContext<Dictionary | null>(null)

export function I18nProvider({ dictionary, children }: { dictionary: Dictionary, children: ReactNode }) {
  return (
    <I18nContext.Provider value={dictionary}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const dictionary = useContext(I18nContext)
  
  if (!dictionary) {
    throw new Error('useTranslation must be used within an I18nProvider')
  }

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

  return { t }
}
