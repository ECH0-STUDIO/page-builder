import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LocalizationForm } from './LocalizationForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Localization Settings' }

export default async function LocalizationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('language, currency')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Localization</h3>
        <p className="text-sm text-muted-foreground">
          Set your preferred language and currency defaults.
        </p>
      </div>
      
      <div className="bg-white border rounded-xl p-6">
        <LocalizationForm 
          initialLanguage={profile?.language || 'en'} 
          initialCurrency={profile?.currency || 'USD'} 
        />
      </div>
    </div>
  )
}
