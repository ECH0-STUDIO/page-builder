import { notFound } from 'next/navigation'
import { loadWebflowPage } from '@/lib/marketing-webflow'
import { WebflowBody } from '@/components/marketing/WebflowBody'
import { WebflowHead } from '@/components/marketing/WebflowHead'
import { WebflowScriptBoot } from '@/components/marketing/WebflowScriptBoot'

export function renderWebflowMarketingPage(slug: string) {
  const page = loadWebflowPage(slug)
  if (!page) notFound()

  return (
    <>
      <WebflowHead headHtml={page.headHtml} />
      <WebflowBody bodyHtml={page.bodyHtml} />
      <WebflowScriptBoot page={page} />
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
