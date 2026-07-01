import type { Metadata } from 'next'
import { NexbetShell } from '@/components/marketing/nexbet/NexbetShell'
import { NexbetPageHeader } from '@/components/marketing/nexbet/NexbetPageHeader'
import { NexbetCta } from '@/components/marketing/nexbet/NexbetBlogSection'
import { getMarketingCopy } from '@/lib/marketing-copy'
import { getPageLocale, type MarketingSearchParams } from '@/lib/marketing-page-locale'
import { appPath } from '@/lib/site-urls'

type Props = { searchParams: Promise<MarketingSearchParams> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const locale = getPageLocale(await searchParams)
  const copy = getMarketingCopy(locale)
  return { title: copy.meta.pricingTitle, description: copy.meta.pricingDescription }
}

export default async function PricingPage({ searchParams }: Props) {
  const locale = getPageLocale(await searchParams)
  const copy = getMarketingCopy(locale)
  const { pricing } = copy

  return (
    <NexbetShell locale={locale}>
      <NexbetPageHeader badge={pricing.badge} title={pricing.title} description={pricing.description} />
      <section className="section_features">
        <div className="padding-global">
          <div className="container-large">
            <div className="impacts_columns" style={{ marginBottom: '3rem' }}>
              <div className="impact_item is-medium">
                <div className="text-lg text-weight-medium">{pricing.startFreeTitle}</div>
                <div className="text-color-secondary">{pricing.startFreeDesc}</div>
              </div>
              <div className="impact_item is-medium">
                <div className="text-lg text-weight-medium">{pricing.buyCreditsTitle}</div>
                <div className="text-color-secondary">{pricing.buyCreditsDesc}</div>
              </div>
            </div>

            <h2 className="h4 text-align-center" style={{ marginBottom: '1.5rem' }}>
              {pricing.whatCreditsFor}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '40rem', margin: '0 auto 3rem' }}>
              {pricing.creditUses.map((item) => (
                <div key={item.label} className="impact_item is-short">
                  <div className="text-weight-medium">{item.label}</div>
                  <div className="text-color-secondary">{item.note}</div>
                  <div className="text-weight-medium">{item.value}</div>
                </div>
              ))}
            </div>

            <h2 className="h4 text-align-center" style={{ marginBottom: '1.5rem' }}>
              {pricing.optionalPacks}
            </h2>
            <p className="text-color-secondary text-align-center" style={{ marginBottom: '2rem' }}>
              {pricing.packsNote}
            </p>
            <div className="features_grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              {pricing.packs.map((pack) => (
                <div
                  key={pack.credits}
                  className="features_card is-short"
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
                  <div className="button_text">{copy.cta.primary}</div>
                  <div className="button_text is-hide">{copy.cta.primary}</div>
                </div>
              </a>
            </div>
          </div>
        </div>
        <div className="padding-section-medium" />
      </section>
      <NexbetCta locale={locale} />
    </NexbetShell>
  )
}
