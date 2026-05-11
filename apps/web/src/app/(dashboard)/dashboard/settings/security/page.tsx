import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SecurityForm } from './SecurityForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Security Settings' }

export default async function SecurityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Security</h3>
        <p className="text-sm text-muted-foreground">
          Update your password and secure your account.
        </p>
      </div>
      
      <div className="bg-white border rounded-xl p-6">
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900">Email Address</h4>
          <p className="text-sm text-gray-500 mt-1">Your account is linked to <span className="font-medium text-gray-900">{user.email}</span>.</p>
        </div>
        <div className="border-t pt-6 mt-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Change Password</h4>
          <SecurityForm />
        </div>
      </div>
    </div>
  )
}
