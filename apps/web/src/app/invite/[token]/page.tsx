import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AcceptInviteForm } from './AcceptInviteForm'
import { I18nProvider } from '@/i18n/I18nProvider'
import { getDictionary } from '@/i18n/getDictionary'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const dictionary = await getDictionary()
  const t = (key: string, vars?: Record<string, string>) => {
    const parts = key.split('.')
    let value: unknown = dictionary
    for (const p of parts) {
      if (value == null || typeof value !== 'object') return key
      value = (value as Record<string, unknown>)[p]
    }
    let out = typeof value === 'string' ? value : key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        out = out.replace(`{${k}}`, v)
      }
    }
    return out
  }

  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: invite } = await adminClient.from('team_invitations')
    .select(`
      id,
      email,
      role,
      status,
      business_id,
      businesses ( name )
    `)
    .eq('token', token)
    .single()

  if (!invite) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
          <h2 className="text-xl font-bold text-gray-900">{t('invite.invalidTitle')}</h2>
          <p className="text-gray-500 mt-2">{t('invite.invalidDesc')}</p>
        </div>
      </div>
    )
  }

  if (invite.status === 'accepted') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
          <h2 className="text-xl font-bold text-gray-900">{t('invite.acceptedTitle')}</h2>
          <p className="text-gray-500 mt-2">{t('invite.acceptedDesc')}</p>
        </div>
      </div>
    )
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/invite/${token}`)
  }

  if (user.email !== invite.email) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
          <h2 className="text-xl font-bold text-gray-900">{t('invite.mismatchTitle')}</h2>
          <p className="text-gray-500 mt-2">
            {t('invite.mismatchDesc', { email: invite.email, current: user.email || '' })}
          </p>
          <p className="text-sm text-gray-400 mt-4">{t('invite.mismatchHint')}</p>
        </div>
      </div>
    )
  }

  const businessName = (invite.businesses as { name?: string } | null)?.name || ''

  return (
    <I18nProvider dictionary={dictionary}>
      <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t('invite.joinTitle')}</h2>
            <p className="text-gray-500 mt-2">
              {t('invite.joinDesc', { business: businessName, role: invite.role })}
            </p>
          </div>
          <AcceptInviteForm token={token} />
        </div>
      </div>
    </I18nProvider>
  )
}
