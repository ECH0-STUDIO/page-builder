'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, Globe, Users, CreditCard, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/I18nProvider'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function SettingsNav() {
  const pathname = usePathname()
  const { t } = useTranslation()
  const router = useRouter()

  const items = [
    {
      title: t('settings.tabs.security'),
      href: '/dashboard/settings/security',
      icon: Shield,
    },
    {
      title: t('settings.tabs.team'),
      href: '/dashboard/settings/team',
      icon: Users,
    },
    {
      title: t('settings.tabs.localization'),
      href: '/dashboard/settings/localization',
      icon: Globe,
    },
    {
      title: t('settings.tabs.credits'),
      href: '/dashboard/settings/credits',
      icon: CreditCard,
    },
  ]

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="flex space-x-2 overflow-x-auto no-scrollbar md:overflow-visible md:flex-col md:space-x-0 md:space-y-1 h-full">
      <div className="flex-1 flex space-x-2 md:flex-col md:space-x-0 md:space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href === '/dashboard/settings/security' && pathname === '/dashboard/settings')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors shrink-0',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          )
        })}
      </div>
      <div className="hidden md:block pt-4 mt-4 border-t">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-destructive shrink-0"
        >
          <LogOut className="h-4 w-4" />
          {t('sidebar.signOut')}
        </button>
      </div>
    </nav>
  )
}
