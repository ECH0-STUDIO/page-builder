import type { Metadata } from 'next'
import Link from 'next/link'
import { NexbetShell } from '@/components/marketing/nexbet/NexbetShell'
import { NexbetPageHeader } from '@/components/marketing/nexbet/NexbetPageHeader'
import { NexbetFeaturesSection } from '@/components/marketing/nexbet/NexbetFeaturesSection'
import { NexbetCta } from '@/components/marketing/nexbet/NexbetBlogSection'
import { getMarketingCopy } from '@/lib/marketing-copy'
import { getPageLocale, type MarketingSearchParams } from '@/lib/marketing-page-locale'
import { marketingPathForLocale } from '@/lib/marketing-locale'

type Props = { searchParams: Promise<MarketingSearchParams> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const locale = getPageLocale(await searchParams)
  const copy = getMarketingCopy(locale)
  return { title: copy.meta.featuresTitle, description: copy.meta.featuresDescription }
}

export default async function FeaturesPage({ searchParams }: Props) {
  const locale = getPageLocale(await searchParams)
  const copy = getMarketingCopy(locale)

  return (
    <NexbetShell locale={locale}>
      <NexbetPageHeader
        badge={copy.featuresPage.badge}
        title={copy.featuresPage.title}
        description={copy.featuresPage.description}
      />
      <NexbetFeaturesSection locale={locale} showViewAll={false} />
      <section className="section_impacts">
        <div className="padding-global">
          <div className="container-large" style={{ textAlign: 'center' }}>
            <Link href={marketingPathForLocale('/pricing', locale)} className="button w-inline-block">
              <div className="button_mask">
                <div className="button_text">{copy.cta.secondary}</div>
                <div className="button_text is-hide">{copy.cta.secondary}</div>
              </div>
            </Link>
          </div>
        </div>
        <div className="padding-section-medium" />
      </section>
      <NexbetCta locale={locale} />
    </NexbetShell>
  )
}
