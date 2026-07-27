import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { I18nProvider } from '@/i18n/I18nProvider'
import { getDictionary } from '@/i18n/getDictionary'

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dictionary = await getDictionary()

  return (
    <I18nProvider dictionary={dictionary}>
      <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg">
          <div className="flex items-center gap-2.5 mb-8 sm:mb-10">
            <span className="text-2xl" aria-hidden>🍽</span>
            <span className="font-extrabold tracking-tight text-xl">Eatery</span>
          </div>
          {children}
        </div>
      </div>
    </I18nProvider>
  )
}
