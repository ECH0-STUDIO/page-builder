import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Globe,
  LayoutTemplate,
  Menu,
  QrCode,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { MarketingCta } from '@/components/marketing/MarketingCta'
import { appPath } from '@/lib/site-urls'

export const metadata: Metadata = {
  title: 'Eatery — Digital Menu Pages for Restaurants & Cafes',
  description:
    'Build a beautiful digital menu page, generate QR codes, accept PayOS payments, and connect your custom domain — in minutes.',
}

const features = [
  {
    icon: LayoutTemplate,
    title: 'Drag-and-drop page builder',
    description: 'Hero, gallery, contact, and payment blocks — no code required.',
  },
  {
    icon: Menu,
    title: 'Digital menus that sell',
    description: 'Photos, categories, and pricing you can update anytime.',
  },
  {
    icon: QrCode,
    title: 'QR codes in one click',
    description: 'Guests open your menu on their phone from every table.',
  },
  {
    icon: Globe,
    title: 'Custom domains',
    description: 'Connect your brand domain with guided DNS setup.',
  },
  {
    icon: Wallet,
    title: 'PayOS payments',
    description: 'Checkout built for Vietnamese restaurants and cafes.',
  },
  {
    icon: Users,
    title: 'Team access',
    description: 'Invite staff without sharing one login.',
  },
]

export default function MarketingHomePage() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-emerald-50 via-white to-white" />
        <div className="absolute top-0 start-1/2 -z-10 w-[1200px] h-[600px] -translate-x-1/2 bg-linear-to-b from-emerald-100/60 to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-x-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 mb-6">
              <Sparkles className="size-3.5" />
              Built for restaurants & cafes
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
              Your digital menu page,{' '}
              <span className="text-emerald-600">live in minutes</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Eatery helps you build a beautiful menu website, generate QR codes, accept payments,
              and connect your own domain — with no monthly subscription trap.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={appPath('/signup')}
                className="inline-flex justify-center items-center py-3 px-6 text-sm font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800"
              >
                Start building free
              </a>
              <Link
                href="/features"
                className="inline-flex justify-center items-center py-3 px-6 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
              >
                See features
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-gray-500">
              <span>
                <strong className="text-gray-900">Free</strong> page builder
              </span>
              <span>
                <strong className="text-gray-900">Pay-as-you-go</strong> credits
              </span>
              <span>
                <strong className="text-gray-900">PayOS</strong> ready
              </span>
            </div>
          </div>

          <div className="mt-16 lg:mt-20 max-w-5xl mx-auto">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
                <span className="size-3 rounded-full bg-red-400" />
                <span className="size-3 rounded-full bg-yellow-400" />
                <span className="size-3 rounded-full bg-green-400" />
                <span className="ms-3 text-xs text-gray-400">your-restaurant.app.eateryvn.com</span>
              </div>
              <div className="grid md:grid-cols-2 gap-0">
                <div className="p-8 md:p-10 bg-linear-to-br from-gray-900 to-gray-800 text-white">
                  <p className="text-sm text-gray-300">Tonight&apos;s specials</p>
                  <h2 className="mt-2 text-3xl font-bold">Saigon Street Kitchen</h2>
                  <p className="mt-3 text-gray-300 text-sm leading-relaxed">
                    Fresh pho, grilled seafood, and craft drinks — browse and order from your table.
                  </p>
                </div>
                <div className="p-8 md:p-10 bg-white">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Dashboard</p>
                  <h3 className="mt-2 text-xl font-bold text-gray-900">Build pages visually</h3>
                  <ul className="mt-6 space-y-3 text-sm text-gray-600">
                    <li>Hero, menu grid, gallery & contact blocks</li>
                    <li>Live mobile preview</li>
                    <li>Publish with one click</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12 lg:mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Everything you need to go digital</h2>
            <p className="mt-4 text-lg text-gray-600">
              From your first menu page to custom domains — on your schedule, not a SaaS billing cycle.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="p-6 lg:p-8 rounded-2xl border border-gray-200 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/50 transition-all"
              >
                <div className="inline-flex justify-center items-center size-12 rounded-xl bg-emerald-50 text-emerald-600 mb-5">
                  <Icon className="size-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-gray-600 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/features" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
              Explore all features →
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900">No packages. No waste.</h2>
            <p className="mt-4 text-lg text-gray-600">
              Most tools charge monthly whether you use them or not. Eatery uses{' '}
              <strong>credits you buy once and spend only when needed</strong> — custom domains,
              extra storage, and more.
            </p>
            <Link
              href="/pricing"
              className="mt-8 inline-flex justify-center items-center py-3 px-6 text-sm font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800"
            >
              How credits work
            </Link>
          </div>
        </div>
      </section>

      <MarketingCta />
    </MarketingShell>
  )
}
