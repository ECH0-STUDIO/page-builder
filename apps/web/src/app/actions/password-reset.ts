'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function completePasswordReset(password: string) {
  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'This reset link has expired. Request a new one.' }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  const jar = await cookies()
  jar.set('eatery_must_reset_password', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 0,
  })
  return { success: true }
}
