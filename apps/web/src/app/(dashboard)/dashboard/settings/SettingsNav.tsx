'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, Globe, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/I18nProvider'

export function SettingsNav() {
  const pathname = usePathname()
  const { t } = useTranslation()

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
  ]

  return (
    <nav className="flex space-x-2 overflow-x-auto no-scrollbar md:overflow-visible md:flex-col md:space-x-0 md:space-y-1">
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
    </nav>
  )
}
