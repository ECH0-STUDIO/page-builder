import { notFound } from 'next/navigation'
import { loadWebflowPage } from '@/lib/marketing-webflow'
import { WebflowHead } from '@/components/marketing/WebflowHead'
import { WebflowPage } from '@/components/marketing/WebflowPage'

export function renderWebflowMarketingPage(slug: string) {
  const page = loadWebflowPage(slug)
  if (!page) notFound()

  return (
    <>
      <WebflowHead headHtml={page.headHtml} />
      <WebflowPage page={page} />
    </>
  )
}

export function getWebflowMetadata(slug: string) {
  const page = loadWebflowPage(slug)
  if (!page) return {}
  return {
    title: page.title,
    description: page.description,
  }
}
