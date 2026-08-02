'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getAuthCallbackUrl } from '@/lib/site-urls'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '@/i18n/I18nProvider'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthCallbackUrl('/dashboard/settings/security'),
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Card id="forgot-success" className="w-full glass shadow-lg">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🔐</div>
          <CardTitle className="text-xl">{t('auth.forgot.successTitle')}</CardTitle>
          <CardDescription>
            {t('auth.forgot.successDescription')}{' '}
            <span className="font-medium text-foreground">{email}</span>.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/login" className="text-sm text-primary font-semibold hover:underline">
            {t('auth.forgot.backToSignIn')}
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card id="forgot-card" className="w-full glass shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">{t('auth.forgot.title')}</CardTitle>
        <CardDescription>
          {t('auth.forgot.description')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {error && (
          <div
            role="alert"
            className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3"
          >
            {error}
          </div>
        )}

        <form id="forgot-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.forgot.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <Button
            type="submit"
            id="forgot-submit"
            className="w-full shadow-brand"
            disabled={loading}
          >
            {loading ? t('auth.forgot.sending') : t('auth.forgot.sendLink')}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          {t('auth.forgot.remember')}{' '}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            {t('auth.forgot.signIn')}
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
