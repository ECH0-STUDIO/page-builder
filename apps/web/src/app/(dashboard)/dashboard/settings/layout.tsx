import { SettingsNav } from './SettingsNav'
import { getServerTranslation } from '@/i18n/getDictionary'
import { getAuthUser } from '@/lib/auth-server'
import { getActiveBusiness } from '@/lib/business-server'
import { canAccessSettingsHref } from '@/lib/dashboard-access'
import { listIncomingInvites } from '@/lib/pending-invitations'
import { IncomingInvitesSection } from '@/components/team/IncomingInvitesSection'

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { t } = await getServerTranslation()
  const { supabase, user } = await getAuthUser()
  const incomingInvites = user?.email ? await listIncomingInvites(user.email) : []
  const { role } = user ? await getActiveBusiness(supabase, user.id) : { role: null }
  const canOpenTeam = canAccessSettingsHref('/dashboard/settings/team', role)

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('settings.description')}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-[200px] shrink-0">
          <SettingsNav incomingInviteCount={incomingInvites.length} />
        </aside>
        <div className="flex-1 min-w-0">
          {!canOpenTeam && <IncomingInvitesSection />}
          {children}
        </div>
      </div>
    </div>
  )
}
