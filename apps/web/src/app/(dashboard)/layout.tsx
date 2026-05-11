import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BusinessProvider } from '@/context/BusinessContext'
import { Sidebar } from '@/components/dashboard/Sidebar'

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

  // Fetch all businesses
  const { data: businesses } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })

  // If no businesses, redirect to onboarding
  if (!businesses || businesses.length === 0) {
    redirect('/onboarding/new-business')
  }

  return (
    <BusinessProvider initialBusinesses={businesses}>
      <div className="flex min-h-screen bg-background">
        <Sidebar
          userEmail={user.email ?? ''}
          userAvatar={profile?.avatar_url}
          userName={profile?.full_name}
        />
        <main className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </BusinessProvider>
  )
}
