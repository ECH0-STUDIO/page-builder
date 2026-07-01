import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { marketingPageExists } from '@/lib/marketing-webflow'
import { getWebflowMetadata, renderWebflowMarketingPage } from '@/components/marketing/render-webflow-page'

export function createWebflowMarketingPage(defaultSlug: string, anchorFallback?: string) {
  return {
    generateMetadata: async (): Promise<Metadata> => {
      if (!marketingPageExists(defaultSlug)) {
        return { title: defaultSlug.charAt(0).toUpperCase() + defaultSlug.slice(1) }
      }
      return getWebflowMetadata(defaultSlug)
    },
    Page: async () => {
      if (!marketingPageExists(defaultSlug)) {
        if (anchorFallback) permanentRedirect(anchorFallback)
        notFound()
      }
      return renderWebflowMarketingPage(defaultSlug)
    },
  }
}
