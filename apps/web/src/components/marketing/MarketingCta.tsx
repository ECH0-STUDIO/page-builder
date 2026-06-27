import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { appPath } from '@/lib/site-urls'

export function MarketingCta() {
  return (
    <section className="py-16 lg:py-24 bg-gray-900">
      <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white">
            Ready to launch your menu online?
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Start free on the app. Buy credits only when you need premium features.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={appPath('/signup')}
              className="inline-flex justify-center items-center py-3 px-6 text-sm font-semibold rounded-lg bg-white text-gray-900 hover:bg-gray-100"
            >
              Create free account
            </a>
            <Link
              href="/pricing"
              className="inline-flex justify-center items-center py-3 px-6 text-sm font-semibold rounded-lg border border-gray-700 text-white hover:bg-gray-800"
            >
              See how pricing works
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description: string
}) {
  return (
    <div className="max-w-3xl mx-auto text-center mb-12 lg:mb-16">
      {eyebrow && (
        <div className="inline-flex items-center gap-x-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 mb-6">
          <Sparkles className="size-3.5" />
          {eyebrow}
        </div>
      )}
      <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">{title}</h1>
      <p className="mt-6 text-lg text-gray-600">{description}</p>
    </div>
  )
}
