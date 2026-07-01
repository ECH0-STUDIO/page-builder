import type { Metadata } from 'next'
import { NexbetShell } from '@/components/marketing/nexbet/NexbetShell'
import { NexbetHero } from '@/components/marketing/nexbet/NexbetHero'
import { NexbetLogoLoop } from '@/components/marketing/nexbet/NexbetLogoLoop'
import { NexbetImpacts } from '@/components/marketing/nexbet/NexbetImpacts'
import { NexbetFeaturesSection } from '@/components/marketing/nexbet/NexbetFeaturesSection'
import { NexbetWorks } from '@/components/marketing/nexbet/NexbetWorks'
import { NexbetBlogSection, NexbetCta } from '@/components/marketing/nexbet/NexbetBlogSection'
import { getBlogPosts } from '@/lib/blog'
import { getMarketingCopy } from '@/lib/marketing-copy'
import { getPageLocale, type MarketingSearchParams } from '@/lib/marketing-page-locale'

type Props = { searchParams: Promise<MarketingSearchParams> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const locale = getPageLocale(await searchParams)
  const copy = getMarketingCopy(locale)
  return { title: copy.meta.homeTitle, description: copy.meta.homeDescription }
}

export default async function MarketingHomePage({ searchParams }: Props) {
  const locale = getPageLocale(await searchParams)
  const posts = await getBlogPosts(locale)

  return (
    <NexbetShell locale={locale}>
      <NexbetHero locale={locale} />
      <NexbetLogoLoop locale={locale} />
      <NexbetImpacts locale={locale} />
      <NexbetFeaturesSection locale={locale} />
      <NexbetWorks locale={locale} />
      <NexbetBlogSection locale={locale} posts={posts} />
      <NexbetCta locale={locale} />
    </NexbetShell>
  )
}
