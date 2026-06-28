'use server'

import { cookies } from 'next/headers'
import { isSupportedLocale, type SupportedLocale } from '@/i18n/locale'

/** Set visitor locale on live store (cookie only — no auth required). */
export async function setLiveStoreLocaleAction(locale: SupportedLocale) {
  if (!isSupportedLocale(locale)) {
    return { error: 'Unsupported locale' }
  }

  const cookieStore = await cookies()
  cookieStore.set('NEXT_LOCALE', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 })

  return { success: true }
}
