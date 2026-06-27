import type { Metadata } from 'next'
import Link from 'next/link'
import { NexbetShell } from '@/components/marketing/nexbet/NexbetShell'
import { NexbetPageHeader } from '@/components/marketing/nexbet/NexbetPageHeader'
import { NexbetFeaturesSection } from '@/components/marketing/nexbet/NexbetFeaturesSection'
import { NexbetCta } from '@/components/marketing/nexbet/NexbetBlogSection'

export const metadata: Metadata = {
  title: 'Features',
  description: 'Page builder, digital menus, QR codes, PayOS, custom domains, and team access for restaurants.',
}

export default function FeaturesPage() {
  return (
    <NexbetShell>
      <NexbetPageHeader
        badge="Product"
        title="Everything a modern restaurant needs online"
        description="One platform for your public menu page, dashboard, payments, and team — without stitching five tools together."
      />
      <NexbetFeaturesSection showViewAll={false} />
      <section className="section_impacts">
        <div className="padding-global">
          <div className="container-large" style={{ textAlign: 'center' }}>
            <Link href="/pricing" className="button w-inline-block">
              <div className="button_mask">
                <div className="button_text">See credit-based pricing</div>
                <div className="button_text is-hide">See credit-based pricing</div>
              </div>
            </Link>
          </div>
        </div>
        <div className="padding-section-medium" />
      </section>
      <NexbetCta />
    </NexbetShell>
  )
}
