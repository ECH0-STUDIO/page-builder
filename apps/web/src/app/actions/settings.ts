'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function updateLocalizationAction(payload: { language: string, currency: string }) {
  const { language, currency } = payload

  // Update cookies for instant middleware/UI reflection
  const cookieStore = await cookies()
  cookieStore.set('NEXT_LOCALE', language, { path: '/', maxAge: 60 * 60 * 24 * 365 })
  cookieStore.set('NEXT_CURRENCY', currency, { path: '/', maxAge: 60 * 60 * 24 * 365 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Save to profile if logged in
    const { error } = await (supabase
      .from('profiles') as any)
      .update({ language, currency })
      .eq('id', user.id)
      
    if (error) {
      console.error('Database update error:', error)
      return { error: error.message }
    }
  }

  revalidatePath('/dashboard/settings/localization')
  return { success: true, error: null }
}
