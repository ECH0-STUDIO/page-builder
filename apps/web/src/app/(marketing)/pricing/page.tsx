import type { Metadata } from 'next'
import { Coins, CreditCard, PiggyBank, Zap } from 'lucide-react'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { MarketingCta, PageHeader } from '@/components/marketing/MarketingCta'
import { appPath } from '@/lib/site-urls'

export const metadata: Metadata = {
  title: 'Pricing — Pay only for what you use',
  description:
    'No monthly SaaS packages. Eatery is free to start. Buy credits when you need custom domains, storage, and premium features.',
}

const creditUses = [
  { label: 'Custom domain connected', credits: '50 credits / month', note: 'Billed while your domain is live' },
  { label: 'Gallery storage', credits: '1 credit per 20 MB', note: 'Scales down if you delete images' },
]

const creditPacks = [
  { credits: 50, price: '50,000₫', note: 'Try premium features' },
  { credits: 100, price: '90,000₫', note: 'Best value for most cafes', highlight: true },
  { credits: 500, price: '400,000₫', note: 'For busy seasons or multiple add-ons' },
]

const comparisons = [
  {
    title: 'Traditional SaaS',
    points: ['Fixed monthly fee', 'Pay when closed or slow', 'Upgrade tiers you may not need'],
    negative: true,
  },
  {
    title: 'Eatery credits',
    points: ['Free core product', 'Spend only on add-ons', 'Balance carries until you use it'],
    negative: false,
  },
]

export default function PricingPage() {
  return (
    <MarketingShell activeNav="/pricing">
      <section className="py-16 lg:py-24">
        <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
          <PageHeader
            eyebrow="Credit-based pricing"
            title="No packages. Pay only for what you use."
            description="The page builder, QR menus, and publishing are free to start. Credits are for premium add-ons — you buy them when you need them, not every month by default."
          />

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            {[
              { icon: Zap, title: 'Start free', text: 'Build and publish your menu page without a subscription.' },
              { icon: Coins, title: 'Buy credits', text: 'Top up when you want custom domains or extra storage.' },
              { icon: PiggyBank, title: 'Spend smart', text: 'Unused credits stay in your balance until you need them.' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="p-6 rounded-2xl border border-gray-200 bg-white text-center">
                <div className="mx-auto size-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <Icon className="size-6" />
                </div>
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm text-gray-600">{text}</p>
              </div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">What credits are for</h2>
            <div className="space-y-4">
              {creditUses.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-5 rounded-xl border border-gray-200 bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.note}</p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-700 whitespace-nowrap">{item.credits}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-gray-500 text-center">
              Core features — page builder, menu management, QR codes, PayOS setup — do not require credits.
            </p>
          </div>

          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Credit packs (optional)</h2>
            <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
              These are top-up amounts inside the app — not mandatory plans. Buy when you are ready for premium features.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {creditPacks.map((pack) => (
                <div
                  key={pack.credits}
                  className={`relative p-6 rounded-2xl border ${
                    pack.highlight
                      ? 'border-emerald-200 bg-emerald-50/50 shadow-lg'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {pack.highlight && (
                    <span className="absolute top-0 end-4 -translate-y-1/2 text-xs font-medium bg-emerald-600 text-white px-3 py-1 rounded-full">
                      Popular
                    </span>
                  )}
                  <div className="flex items-center gap-2 text-3xl font-bold text-gray-900">
                    <Coins className="size-8 text-yellow-500" />
                    {pack.credits}
                  </div>
                  <p className="mt-2 text-lg font-semibold text-gray-800">{pack.price}</p>
                  <p className="mt-2 text-sm text-gray-600">{pack.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {comparisons.map((col) => (
              <div
                key={col.title}
                className={`p-8 rounded-2xl border ${
                  col.negative ? 'border-gray-200 bg-gray-50' : 'border-emerald-200 bg-white'
                }`}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">{col.title}</h3>
                <ul className="space-y-3">
                  {col.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className={col.negative ? 'text-gray-400' : 'text-emerald-600'}>
                        {col.negative ? '×' : '✓'}
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 max-w-2xl mx-auto text-center p-8 rounded-2xl bg-gray-900 text-white">
            <CreditCard className="size-8 mx-auto mb-4 opacity-80" />
            <h3 className="text-xl font-bold">Payments via PayOS</h3>
            <p className="mt-3 text-gray-300 text-sm">
              Credit purchases checkout through PayOS in the app. Discount codes can be applied at purchase when available.
            </p>
            <a
              href={appPath('/signup')}
              className="mt-6 inline-flex py-3 px-6 text-sm font-semibold rounded-lg bg-white text-gray-900 hover:bg-gray-100"
            >
              Create free account
            </a>
          </div>
        </div>
      </section>
      <MarketingCta />
    </MarketingShell>
  )
}
