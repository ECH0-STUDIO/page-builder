'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function LocalizationForm({ initialLanguage, initialCurrency }: { initialLanguage: string, initialCurrency: string }) {
  const [language, setLanguage] = useState(initialLanguage)
  const [currency, setCurrency] = useState(initialCurrency)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ language, currency })
      .eq('id', user.id)

    setLoading(false)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Preferences updated')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-sm">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700" htmlFor="language">Interface Language</label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full h-10 px-3 bg-white rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
        >
          <option value="en">English</option>
          <option value="vi">Tiếng Việt</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">Updates the dashboard and public menu defaults.</p>
      </div>
      
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700" htmlFor="currency">Default Currency</label>
        <select
          id="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-full h-10 px-3 bg-white rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
        >
          <option value="USD">USD ($)</option>
          <option value="VND">VND (₫)</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="h-10 px-4 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center disabled:opacity-50"
      >
        {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
        Save Preferences
      </button>
    </form>
  )
}
