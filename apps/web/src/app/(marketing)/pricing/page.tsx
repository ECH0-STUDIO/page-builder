import type { Metadata } from 'next'
import { NexbetShell } from '@/components/marketing/nexbet/NexbetShell'
import { NexbetPageHeader } from '@/components/marketing/nexbet/NexbetPageHeader'
import { NexbetCta } from '@/components/marketing/nexbet/NexbetBlogSection'
import { appPath } from '@/lib/site-urls'

export const metadata: Metadata = {
  title: 'Pricing — Pay only for what you use',
  description: 'No monthly SaaS packages. Start free, buy credits for premium add-ons like custom domains and storage.',
}

const creditUses = [
  { label: 'Custom domain connected', value: '50 credits / month', note: 'Billed while your domain is live' },
  { label: 'Gallery storage', value: '1 credit per 20 MB', note: 'Renews based on usage — drops if you delete images' },
]

const packs = [
  { credits: 50, price: '50,000₫', note: 'Try premium features' },
  { credits: 100, price: '90,000₫', note: 'Best value for most cafes', highlight: true },
  { credits: 500, price: '400,000₫', note: 'Busy seasons or multiple add-ons' },
]

export default function PricingPage() {
  return (
    <NexbetShell>
      <NexbetPageHeader
        badge="Credit-based pricing"
        title="No packages. Pay only for what you use."
        description="The page builder, QR menus, and publishing are free to start. Credits are for premium add-ons — buy them when you need them."
      />
      <section className="section_features">
        <div className="padding-global">
          <div className="container-large">
            <div className="impacts_columns" style={{ marginBottom: '3rem' }}>
              <div className="impact_item is-medium">
                <div className="text-lg text-weight-medium">Start free</div>
                <div className="text-color-secondary">
                  Build and publish your menu page without a subscription. No credit card required.
                </div>
              </div>
              <div className="impact_item is-medium">
                <div className="text-lg text-weight-medium">Buy credits</div>
                <div className="text-color-secondary">
                  Top up when you want a custom domain or extra gallery storage. Unused credits stay in your balance.
                </div>
              </div>
            </div>

            <h2 className="h4 text-align-center" style={{ marginBottom: '1.5rem' }}>
              What credits are for
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '40rem', margin: '0 auto 3rem' }}>
              {creditUses.map((item) => (
                <div key={item.label} className="impact_item is-short">
                  <div className="text-weight-medium">{item.label}</div>
                  <div className="text-color-secondary">{item.note}</div>
                  <div className="text-weight-medium">{item.value}</div>
                </div>
              ))}
            </div>

            <h2 className="h4 text-align-center" style={{ marginBottom: '1.5rem' }}>
              Optional credit packs
            </h2>
            <p className="text-color-secondary text-align-center" style={{ marginBottom: '2rem' }}>
              Top-up amounts inside the app — not mandatory plans.
            </p>
            <div className="features_grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              {packs.map((pack) => (
                <div
                  key={pack.credits}
                  className={`features_card is-short${pack.highlight ? '' : ''}`}
                  style={pack.highlight ? { border: '2px solid var(--base--black)' } : undefined}
                >
                  <div className="feature_card_content">
                    <div className="text-3xl text-weight-medium">{pack.credits}</div>
                    <div className="text-weight-medium">credits</div>
                    <div className="h5">{pack.price}</div>
                    <div className="text-color-secondary">{pack.note}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <a href={appPath('/signup')} className="button-icon w-inline-block">
                <div className="button_mask">
                  <div className="button_text">Create free account</div>
                  <div className="button_text is-hide">Create free account</div>
                </div>
              </a>
            </div>
          </div>
        </div>
        <div className="padding-section-medium" />
      </section>
      <NexbetCta />
    </NexbetShell>
  )
}
