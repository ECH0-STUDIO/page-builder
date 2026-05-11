import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Team Management' }

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Team Management</h3>
        <p className="text-sm text-muted-foreground">
          Invite staff and manage their access levels.
        </p>
      </div>
      
      <div className="bg-white border rounded-xl p-6 text-center py-12">
        <h4 className="text-sm font-medium text-gray-900 mb-1">Coming Soon</h4>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Team management and role-based access control is currently in development. You will soon be able to invite managers and staff here.
        </p>
      </div>
    </div>
  )
}
