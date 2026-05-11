import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2.5 mb-10">
          <span className="text-2xl">🍽</span>
          <span className="font-extrabold tracking-tight text-xl">Eatery</span>
        </div>
        {children}
      </div>
    </div>
  )
}
