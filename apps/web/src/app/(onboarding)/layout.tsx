import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { I18nProvider } from '@/i18n/I18nProvider'
import { getDictionary } from '@/i18n/getDictionary'
import { IncomingInvitesSection } from '@/components/team/IncomingInvitesSection'
import { SignOutLink } from '@/components/auth/SignOutLink'

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
          <div className="flex items-center justify-between gap-4 mb-8 sm:mb-10">
            <div className="relative w-36 h-10">
              <Image src="/logo-full.png" alt="Eatery" fill className="object-contain object-left" priority />
            </div>
            <SignOutLink />
          </div>
          <IncomingInvitesSection />
          {children}
        </div>
      </div>
    </I18nProvider>
  )
}
