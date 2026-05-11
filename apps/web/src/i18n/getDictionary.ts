import 'server-only'
import { cookies } from 'next/headers'

const dictionaries = {
  en: () => import('./dictionaries/en.json').then((module) => module.default),
  vi: () => import('./dictionaries/vi.json').then((module) => module.default),
}

export type Locale = keyof typeof dictionaries

export const getDictionary = async (locale?: Locale) => {
  if (!locale) {
    const cookieStore = await cookies()
    const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value as Locale
    locale = cookieLocale || 'en'
  }
  
  if (!dictionaries[locale]) {
    locale = 'en'
  }

  return dictionaries[locale]()
}

export const getServerTranslation = async (locale?: Locale) => {
  const dictionary = await getDictionary(locale)
  
  const t = (key: string) => {
    const keys = key.split('.')
    let value = dictionary as any
    
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
