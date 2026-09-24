'use server'

import { cookies } from 'next/headers'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getAppBaseUrl } from '@/lib/site-urls'
import { sendPasswordResetEmail } from '@/lib/email'
import { getServerTranslation } from '@/i18n/getDictionary'

const resetCookie = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  maxAge: 60 * 30,
}

export async function requestPasswordReset(email: string) {
  const normalized = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { error: 'Enter a valid email address.' }
  }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: normalized,
    options: { redirectTo: `${getAppBaseUrl()}/reset-password` },
  })

  if (error || !data?.properties?.hashed_token) {
    const message = (error?.message || '').toLowerCase()
    // Same response as a real send, so this form cannot be used to look up accounts.
    if (message.includes('not found') || message.includes('no user')) {
      return { success: true }
    }
    console.error('[password-reset] generateLink failed')
    return { error: 'Could not send the reset email. Try again in a minute.' }
  }

  const resetLink = `${getAppBaseUrl()}/reset-password?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=recovery`
  const { t } = await getServerTranslation()
  const sent = await sendPasswordResetEmail({
    toEmail: normalized,
    resetLink,
    subject: t('auth.forgot.emailSubject'),
    intro: t('auth.forgot.emailIntro'),
    button: t('auth.forgot.emailButton'),
  })

  if (sent.error) return { error: 'Could not send the reset email. Try again in a minute.' }
  return { success: true }
}

export async function establishRecoverySession(tokenHash: string) {
  if (!tokenHash) return { error: 'This reset link is invalid.' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({
    type: 'recovery',
    token_hash: tokenHash,
  })

  if (error || !data.user) {
    return { error: 'This reset link has expired. Request a new one.' }
  }

  const jar = await cookies()
  jar.set('eatery_must_reset_password', '1', resetCookie)
  return { success: true, email: data.user.email ?? null }
}

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
