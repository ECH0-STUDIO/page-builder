'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, Globe, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  {
    title: 'Security',
    href: '/dashboard/settings/security',
    icon: Shield,
  },
  {
    title: 'Team Management',
    href: '/dashboard/settings/team',
    icon: Users,
  },
  {
    title: 'Localization',
    href: '/dashboard/settings/localization',
    icon: Globe,
  },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="flex space-x-2 md:flex-col md:space-x-0 md:space-y-1">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href === '/dashboard/settings/security' && pathname === '/dashboard/settings')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
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
