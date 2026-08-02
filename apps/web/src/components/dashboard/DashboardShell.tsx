'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface DashboardShellProps {
  sidebar: React.ReactNode
  children: React.ReactNode
}

/** Keeps the sidebar mounted (hidden) on full-screen routes to avoid remount cost. */
export function DashboardShell({ sidebar, children }: DashboardShellProps) {
  const pathname = usePathname()
  const isFullScreen =
    pathname?.startsWith('/dashboard/pages') ||
    pathname?.startsWith('/dashboard/order-page')

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <div className={cn(isFullScreen && 'hidden')}>{sidebar}</div>
      <main className={cn('flex-1 min-w-0 overflow-y-auto', isFullScreen && 'w-full')}>
        {children}
      </main>
    </div>
  )
}
