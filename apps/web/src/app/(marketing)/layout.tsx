import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './marketing.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_MARKETING_URL || 'http://localhost:3000'),
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <div className={`marketing-site ${inter.className}`}>{children}</div>
}
