import type { Metadata } from 'next'
import { NexbetShell } from '@/components/marketing/nexbet/NexbetShell'
import { ContactForm } from '@/components/marketing/nexbet/ContactForm'
import { getMarketingCopy } from '@/lib/marketing-copy'
import { getPageLocale, type MarketingSearchParams } from '@/lib/marketing-page-locale'

type Props = { searchParams: Promise<MarketingSearchParams> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const locale = getPageLocale(await searchParams)
  const copy = getMarketingCopy(locale)
  return { title: copy.meta.contactTitle, description: copy.meta.contactDescription }
}

export default async function ContactPage({ searchParams }: Props) {
  const locale = getPageLocale(await searchParams)

  return (
    <NexbetShell locale={locale}>
      <ContactForm locale={locale} />
    </NexbetShell>
  )
}
