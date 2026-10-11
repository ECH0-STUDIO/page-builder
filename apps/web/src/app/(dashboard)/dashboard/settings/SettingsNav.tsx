'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, Globe, Users, CreditCard, Languages } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/I18nProvider'
import { useBusiness } from '@/context/BusinessContext'
import { canAccessSettingsHref } from '@/lib/dashboard-access'

export function SettingsNav({ incomingInviteCount = 0 }: { incomingInviteCount?: number }) {
  const pathname = usePathname()
  const { t } = useTranslation()
  const { currentBusiness } = useBusiness()
  const role = currentBusiness?.role

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
      title: t('settings.tabs.languages') || 'Store languages',
      href: '/dashboard/settings/languages',
      icon: Languages,
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
  ].filter(item => canAccessSettingsHref(item.href, role))

  return (
    <nav className="w-full md:h-full">
      <div className="-mx-1 px-1 overflow-x-auto no-scrollbar md:overflow-visible">
        <div className="flex flex-nowrap items-center gap-1.5 md:flex-col md:items-stretch md:gap-1 w-max md:w-full">
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href === '/dashboard/settings/security' && pathname === '/dashboard/settings')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs sm:text-sm font-medium transition-colors shrink-0 whitespace-nowrap md:w-full md:px-3 md:py-2',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="truncate">{item.title}</span>
                {item.href === '/dashboard/settings/team' && incomingInviteCount > 0 && (
                  <span className="ml-auto size-2 rounded-full bg-red-500 shrink-0" aria-hidden />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
