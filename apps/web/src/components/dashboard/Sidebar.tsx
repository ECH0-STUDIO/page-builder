'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Store,
  Palette,
  UtensilsCrossed,
  Printer,
  QrCode,
  CreditCard,
  Globe,
  LogOut,
  ChevronRight,
  BellRing,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BusinessSwitcher } from './BusinessSwitcher'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useTranslation } from '@/i18n/I18nProvider'

const NAV_ITEMS = [
  {
    labelKey: 'overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    phase: 'v1',
    exact: true, // only active on exact /dashboard
  },
  {
    labelKey: 'liveOrders',
    href: '/dashboard/orders',
    icon: BellRing,
    phase: 'v1',
    exact: false,
  },
  {
    labelKey: 'businessProfile',
    href: '/dashboard/business',
    icon: Store,
    phase: 'v1',
    exact: false,
  },
  {
    labelKey: 'menu',
    href: '/dashboard/menu',
    icon: UtensilsCrossed,
    phase: 'v1',
    exact: false,
  },
  {
    labelKey: 'pageBuilder',
    href: '/dashboard/pages',
    icon: Palette,
    phase: 'v1',
    exact: false,
  },
  {
    labelKey: 'printMenu',
    href: '/dashboard/print-menu',
    icon: Printer,
    phase: 'v1',
    exact: false,
  },
  {
    labelKey: 'qrCodes',
    href: '/dashboard/qr',
    icon: QrCode,
    phase: 'v1',
    exact: false,
  },
  {
    labelKey: 'payments',
    href: '/dashboard/payments',
    icon: CreditCard,
    phase: 'v1',
    exact: false,
  },
  {
    labelKey: 'publishing',
    href: '/dashboard/publishing',
    icon: Globe,
    phase: 'v1',
    exact: false,
  },
] as const

interface SidebarProps {
  userEmail: string
  userAvatar?: string | null
  userName?: string | null
}

export function Sidebar({ userEmail, userAvatar, userName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success(t('sidebar.signOut'))
    router.push('/login')
    router.refresh()
  }

  const initials = (userName ?? userEmail)
    .split(/[\s@]/)
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <aside className="flex flex-col w-[240px] shrink-0 border-r border-sidebar-border bg-sidebar h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border">
        <span className="text-xl">🍽</span>
        <span className="font-extrabold tracking-tight text-sidebar-foreground">Eatery</span>
      </div>

      {/* Business Switcher */}
      <div className="px-2 py-3 border-b border-sidebar-border">
        <BusinessSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.labelKey.toLowerCase().replace(/\s+/g, '-')}`}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="size-4 shrink-0" />
              <span className="text-sm font-medium">{t(`sidebar.${item.labelKey}`)}</span>
            </Link>
          )
        })}
      </nav>

      {/* User + Sign out */}
      <div className="px-2 py-3 border-t border-sidebar-border space-y-0.5">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar className="size-7 shrink-0">
            <AvatarImage src={userAvatar ?? undefined} />
            <AvatarFallback className="text-xs font-bold bg-muted text-muted-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">
              {userName ?? t('sidebar.account')}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{userEmail}</p>
          </div>
        </div>
        
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors',
            pathname.startsWith('/dashboard/settings')
              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )}
        >
          <Settings className="size-4 shrink-0" />
          <span className="text-sm font-medium">{t('sidebar.settings')}</span>
        </Link>

        <button
          id="sign-out-btn"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-sidebar-accent hover:text-destructive transition-colors"
        >
          <LogOut className="size-4 shrink-0" />
          <span className="text-sm font-medium">{t('sidebar.signOut')}</span>
        </button>
      </div>
    </aside>
  )
}
