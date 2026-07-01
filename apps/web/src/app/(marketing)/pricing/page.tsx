import type { Metadata } from 'next'
import { createWebflowMarketingPage } from '@/components/marketing/create-webflow-marketing-page'

const page = createWebflowMarketingPage('pricing', '/')

export const generateMetadata = page.generateMetadata
export default page.Page
