'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  ChevronRight,
  BellRing,
  Settings,
  Menu,
  Coins,
  Image as ImageIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BusinessSwitcher } from './BusinessSwitcher'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useTranslation } from '@/i18n/I18nProvider'
import { useBusiness } from '@/context/BusinessContext'
import { getCreditBalanceAction } from '@/app/actions/credits'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

const NAV_ITEMS = [
  {
    labelKey: 'overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    phase: 'v1',
    exact: true,
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
    labelKey: 'gallery',
    href: '/dashboard/gallery',
    icon: ImageIcon,
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
  const { currentBusiness } = useBusiness()
  const isStaff = currentBusiness?.role === 'staff'
  const [mobileOpen, setMobileOpen] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)

  useEffect(() => {
    if (currentBusiness?.id && !isStaff) {
      getCreditBalanceAction(currentBusiness.id).then(res => {
        if (res.success && res.data !== undefined) {
          setCredits(res.data)
        } else {
          console.error('Failed to load credits:', res.error)
          setCredits(0)
        }
      })
    }
  }, [currentBusiness?.id, isStaff])



  const initials = (userName ?? userEmail)
    .split(/[\s@]/)
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border">
        <div className="relative w-24 h-8">
          <Image src="/logo-full.png" alt="Eatery" fill className="object-contain object-left" priority />
        </div>
      </div>

      {/* Business Switcher */}
      <div className="px-2 py-3 border-b border-sidebar-border">
        <BusinessSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
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

      <div className="px-3 py-3 border-t border-sidebar-border mt-auto shrink-0 space-y-2">
        {!isStaff && credits !== null && (
          <div className="flex items-center justify-between rounded-lg bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Coins className="size-4 shrink-0" />
              <span className="text-sm font-semibold">{credits} Credits</span>
            </div>
            <Link
              href="/dashboard/settings/credits"
              onClick={() => setMobileOpen(false)}
              className="text-[10px] uppercase font-bold tracking-wider opacity-70 hover:opacity-100 transition-opacity bg-yellow-500/20 px-2 py-1 rounded"
            >
              {t('sidebar.topUp')}
            </Link>
          </div>
        )}

        <div className="flex gap-2">
          <Link
            href="/dashboard/settings"
            onClick={() => setMobileOpen(false)}
            className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Settings className="size-4" />
            {t('sidebar.settings')}
          </Link>
        </div>

        <div className="pt-2">
          <div className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left">
            <Avatar className="size-8 shrink-0">
              <AvatarImage src={userAvatar ?? undefined} />
              <AvatarFallback className="text-xs font-bold bg-muted text-muted-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">
                {userName ?? t('sidebar.account')}
              </p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Top Navigation */}
      <div className="md:hidden flex items-center px-4 h-14 border-b bg-background sticky top-0 z-40 relative">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button className="p-2 -ml-2 text-muted-foreground hover:text-foreground z-10">
              <Menu className="size-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px] flex flex-col bg-sidebar border-r-sidebar-border text-sidebar-foreground">
            <VisuallyHidden><SheetTitle>Navigation Menu</SheetTitle></VisuallyHidden>
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-20 h-6">
            <Image src="/logo-full.png" alt="Eatery" fill className="object-contain" priority />
          </div>
        </div>
      </div>

      {/* Desktop Permanent Sidebar */}
      <aside className="hidden md:flex flex-col w-[240px] shrink-0 border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
        <SidebarContent />
      </aside>
    </>
  )
}
