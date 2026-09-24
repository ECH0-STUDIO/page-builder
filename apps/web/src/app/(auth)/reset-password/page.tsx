'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { completePasswordReset } from '@/app/actions/password-reset'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '@/i18n/I18nProvider'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const [ready, setReady] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
      setReady(true)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError(t('auth.reset.minLength'))
      return
    }
    if (password !== confirm) {
      setError(t('auth.reset.mismatch'))
      return
    }
    setLoading(true)
    const res = await completePasswordReset(password)
    if (res.error) {
      setError(res.error)
      setLoading(false)
      return
    }
    window.location.assign('/dashboard')
  }

  if (!ready) {
    return (
      <Card className="w-full glass shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">{t('auth.reset.title')}</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (!email) {
    return (
      <Card className="w-full glass shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">{t('auth.reset.title')}</CardTitle>
          <CardDescription>{t('auth.reset.needLink')}</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/forgot-password" className="text-sm text-primary font-semibold hover:underline">
            {t('auth.reset.request')}
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full glass shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">{t('auth.reset.title')}</CardTitle>
        <CardDescription>
          {t('auth.reset.description')}{' '}
          <span className="font-medium text-foreground">{email}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div role="alert" className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="new-password">{t('auth.reset.newPassword')}</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">{t('auth.reset.confirmPassword')}</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full shadow-brand" disabled={loading}>
            {loading ? t('auth.reset.saving') : t('auth.reset.save')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
