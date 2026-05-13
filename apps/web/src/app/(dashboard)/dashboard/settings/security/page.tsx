import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SecurityForm } from './SecurityForm'
import type { Metadata } from 'next'
import { getServerTranslation } from '@/i18n/getDictionary'

export const metadata: Metadata = { title: 'Security Settings' }

export default async function SecurityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { t } = await getServerTranslation()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('settings.security.title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('settings.security.description')}
        </p>
      </div>
      
      <div className="bg-white border rounded-xl p-6">
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900">{t('settings.security.emailAddress')}</h4>
          <p className="text-sm text-gray-500 mt-1">{t('settings.security.emailLinked')} <span className="font-medium text-gray-900">{user.email}</span>.</p>
        </div>
        <div className="border-t pt-6 mt-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">{t('settings.security.changePassword')}</h4>
          <SecurityForm />
        </div>
      </div>
    </div>
  )
}
