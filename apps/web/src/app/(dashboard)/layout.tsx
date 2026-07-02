import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BusinessProvider } from '@/context/BusinessContext'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { I18nProvider } from '@/i18n/I18nProvider'
import { getDictionary } from '@/i18n/getDictionary'
import { GlobalNavLoader } from '@/components/GlobalNavLoader'
import { Suspense } from 'react'
import { getActiveBusiness, getAllUserBusinessesServer } from '@/lib/business-server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single() as { data: { full_name: string | null; avatar_url: string | null } | null }

  // Fetch active business (for fallback and validation)
  const { business } = await getActiveBusiness(supabase, user.id)

  // If no business at all, redirect to onboarding
  if (!business) {
    redirect('/onboarding/new-business')
  }

  // Fetch ALL businesses the user has access to for the Switcher
  const businesses = await getAllUserBusinessesServer(user.id)

  // Load the dictionary for the current session's language
  const dictionary = await getDictionary()

  return (
    <I18nProvider dictionary={dictionary}>
      <BusinessProvider initialBusinesses={businesses} initialActiveBusinessId={business.id}>
        <DashboardShell
          sidebar={
            <Sidebar
              userEmail={user.email ?? ''}
              userAvatar={profile?.avatar_url}
              userName={profile?.full_name}
            />
          }
        >
          {children}
        </DashboardShell>
        <Suspense fallback={null}>
          <GlobalNavLoader />
        </Suspense>
      </BusinessProvider>
    </I18nProvider>
  )
}
