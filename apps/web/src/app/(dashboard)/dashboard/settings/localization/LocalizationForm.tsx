'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { updateLocalizationAction } from '@/app/actions/settings'

import { useTranslation } from '@/i18n/I18nProvider'

export function LocalizationForm({ initialLanguage, initialCurrency }: { initialLanguage: string, initialCurrency: string }) {
  const [region, setRegion] = useState(`${initialLanguage}-${initialCurrency}`)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { t } = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const [language, currency] = region.split('-')
    const res = await updateLocalizationAction({ language, currency })

    setLoading(false)

    if (res.error) {
      toast.error('Failed to update preferences')
    } else {
      toast.success('Preferences updated')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-sm">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700" htmlFor="region">{t('settings.localization.regionLabel')}</label>
        <select
          id="region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-full h-10 px-3 bg-white rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
        >
          <option value="en-USD">{t('settings.localization.enOption')}</option>
          <option value="vi-VND">{t('settings.localization.viOption')}</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">{t('settings.localization.regionSub')}</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="h-10 px-4 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center disabled:opacity-50"
      >
        {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
        {t('settings.localization.save')}
      </button>
    </form>
  )
}
