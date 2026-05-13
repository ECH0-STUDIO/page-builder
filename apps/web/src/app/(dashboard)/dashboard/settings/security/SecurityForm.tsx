'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '@/i18n/I18nProvider'

export function SecurityForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      toast.error(t('settings.security.minLength'))
      return
    }

    if (password !== confirmPassword) {
      toast.error(t('settings.security.mismatch'))
      return
    }

    setLoading(true)
    const supabase = createClient()
    
    const { error } = await supabase.auth.updateUser({
      password: password
    })

    setLoading(false)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(t('settings.security.success'))
      setPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700" htmlFor="new-password">{t('settings.security.newPassword')}</label>
        <input
          id="new-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
        />
      </div>
      
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700" htmlFor="confirm-password">{t('settings.security.confirmPassword')}</label>
        <input
          id="confirm-password"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-10 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center disabled:opacity-50"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : t('settings.security.save')}
      </button>
    </form>
  )
}
