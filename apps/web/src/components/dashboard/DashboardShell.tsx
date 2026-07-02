'use client'

import { usePathname } from 'next/navigation'

interface DashboardShellProps {
  sidebar: React.ReactNode
  children: React.ReactNode
}

/** Hides the dashboard sidebar on full-screen routes (e.g. page builder). */
export function DashboardShell({ sidebar, children }: DashboardShellProps) {
  const pathname = usePathname()
  const isFullScreen = pathname?.startsWith('/dashboard/pages')

  if (isFullScreen) {
    return <>{children}</>
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {sidebar}
      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  )
}
