import type { Metadata } from 'next'
import { getWebflowMetadata, renderWebflowMarketingPage } from '@/components/marketing/render-webflow-page'

export function generateMetadata(): Metadata {
  return getWebflowMetadata('index')
}

export default function MarketingHomePage() {
  return renderWebflowMarketingPage('index')
}
