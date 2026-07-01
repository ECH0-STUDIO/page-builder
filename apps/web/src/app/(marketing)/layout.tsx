import type { Metadata } from 'next'
import './marketing.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_MARKETING_URL || 'http://localhost:3000'),
}

const WEBFLOW_STYLES = [
  '/marketing/css/normalize.css',
  '/marketing/css/webflow.css',
  '/marketing/css/thais-fantabulous-site-defac5.webflow.css',
] as const

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {WEBFLOW_STYLES.map((href) => (
        <link key={href} rel="stylesheet" href={href} precedence="default" />
      ))}
      <div className="marketing-site">{children}</div>
    </>
  )
}
