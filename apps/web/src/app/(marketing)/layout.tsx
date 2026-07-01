import type { Metadata } from 'next'
import './marketing.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_MARKETING_URL || 'http://localhost:3000'),
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <div className="marketing-site">{children}</div>
}
