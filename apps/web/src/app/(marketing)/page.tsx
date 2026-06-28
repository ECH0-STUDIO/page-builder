import type { Metadata } from 'next'
import { NexbetShell } from '@/components/marketing/nexbet/NexbetShell'
import { NexbetHero } from '@/components/marketing/nexbet/NexbetHero'
import { NexbetLogoLoop } from '@/components/marketing/nexbet/NexbetLogoLoop'
import { NexbetImpacts } from '@/components/marketing/nexbet/NexbetImpacts'
import { NexbetFeaturesSection } from '@/components/marketing/nexbet/NexbetFeaturesSection'
import { NexbetWorks } from '@/components/marketing/nexbet/NexbetWorks'
import { NexbetBlogSection, NexbetCta } from '@/components/marketing/nexbet/NexbetBlogSection'
import { getBlogPosts } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Eatery — Digital Menu Pages for Restaurants & Cafes',
  description:
    'Build a beautiful digital menu page, generate QR codes, accept PayOS payments, and connect your custom domain — pay only for what you use.',
}

export default async function MarketingHomePage() {
  const posts = await getBlogPosts()

  return (
    <NexbetShell>
      <NexbetHero />
      <NexbetLogoLoop />
      <NexbetImpacts />
      <NexbetFeaturesSection />
      <NexbetWorks />
      <NexbetBlogSection posts={posts} />
      <NexbetCta />
    </NexbetShell>
  )
}
