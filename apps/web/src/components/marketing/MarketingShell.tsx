import { PrelineInit } from './PrelineInit'
import { MarketingNav } from './MarketingNav'
import { MarketingFooter } from './MarketingFooter'

export function MarketingShell({
  children,
  activeNav,
}: {
  children: React.ReactNode
  activeNav?: string
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <PrelineInit />
      <MarketingNav active={activeNav} />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  )
}
