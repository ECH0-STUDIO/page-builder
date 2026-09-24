import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Validate `next` to prevent open-redirect: only allow relative paths
  const rawNext = searchParams.get('next') ?? '/dashboard'
  const next = rawNext.startsWith('/') && !rawNext.includes('://') ? rawNext : '/dashboard'

  const tokenHash = searchParams.get('token_hash')
  const otpType = searchParams.get('type')
  const supabase = await createClient()

  if (tokenHash && (otpType === 'recovery' || otpType === 'magiclink' || otpType === 'signup' || otpType === 'invite' || otpType === 'email')) {
    const { error } = await supabase.auth.verifyOtp({
      type: otpType,
      token_hash: tokenHash,
    })
    if (!error) {
      const response = NextResponse.redirect(`${origin}${otpType === 'recovery' ? '/reset-password' : next}`)
      if (otpType === 'recovery') {
        response.cookies.set('eatery_must_reset_password', '1', {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 30,
        })
      }
      return response
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`)
      if (next === '/reset-password') {
        response.cookies.set('eatery_must_reset_password', '1', {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 30,
        })
      }
      return response
    }
  }

  if (next === '/reset-password' || otpType === 'recovery') {
    return NextResponse.redirect(`${origin}/forgot-password?error=reset_link`)
  }

  // Auth error — redirect to login with error param
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
