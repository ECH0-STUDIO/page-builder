'use client'

import { createClient } from '@/lib/supabase/client'

/** Ends the session and clears the active-business selection before a full navigation. */
export async function signOutTo(path = '/login') {
  const supabase = createClient()
  await supabase.auth.signOut()
  try {
    localStorage.removeItem('eatery_current_business_id')
  } catch {
    // ignore
  }
  document.cookie = 'eatery_current_business_id=; path=/; max-age=0'
  window.location.assign(path)
}
