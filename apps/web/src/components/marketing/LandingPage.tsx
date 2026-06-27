import Image from 'next/image'
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
import { PrelineInit } from './PrelineInit'

const features = [
  {
    icon: LayoutTemplate,
    title: 'Drag-and-drop page builder',
    description:
      'Launch a beautiful menu page with hero, gallery, contact, and payment blocks — no code required.',
  },
  {
    icon: Menu,
    title: 'Digital menus that sell',
    description:
      'Show dishes with photos, categories, and pricing. Update items anytime from your dashboard.',
  },
  {
    icon: QrCode,
    title: 'QR codes in one click',
    description:
      'Generate table QR codes so guests open your menu on their phone instantly.',
  },
  {
    icon: Globe,
    title: 'Custom domains',
    description:
      'Connect your own domain with guided DNS setup so your brand stays front and center.',
  },
  {
    icon: Wallet,
    title: 'PayOS payments',
    description:
      'Accept payments with a drawer checkout flow built for Vietnamese restaurants and cafes.',
  },
  {
    icon: Users,
    title: 'Team access',
    description:
      'Invite staff to help manage menus, pages, and settings without sharing one login.',
  },
]

const steps = [
  {
    step: '01',
    title: 'Create your account',
    description: 'Sign up free and add your restaurant or cafe in minutes.',
  },
  {
    step: '02',
    title: 'Build your page',
    description: 'Pick a template, add your menu, photos, and contact details.',
  },
  {
    step: '03',
    title: 'Publish & share',
    description: 'Go live with a link, QR code, or your own custom domain.',
  },
]

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    note: 'Perfect to launch your first menu page',
    features: ['Page builder & templates', 'QR code generation', 'Basic menu management', 'Public menu link'],
    cta: 'Start free',
    highlighted: false,
  },
  {
    name: 'Growth',
    price: 'Credits',
    note: 'Pay only for premium add-ons you use',
    features: [
      'Custom domain connection',
      'Extra gallery storage',
      'Priority publishing tools',
      'Team invites',
    ],
    cta: 'Create account',
    highlighted: true,
  },
]

export function LandingPage() {
  return (
    <>
      <PrelineInit />

      <header className="sticky top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <nav className="max-w-[85rem] flex flex-wrap md:flex-nowrap basis-full items-center justify-between mx-auto py-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-x-3">
            <Link href="/" className="flex-none rounded-md focus:outline-hidden focus:opacity-80">
              <Image src="/logo-full.png" alt="Eatery" width={140} height={40} className="h-9 w-auto" priority />
            </Link>
          </div>

          <div className="md:order-3 flex items-center gap-x-2">
            <Link
              href="/login"
              className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent text-gray-800 hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 focus:outline-hidden focus:bg-gray-800"
            >
              Get started
            </Link>

            <div className="md:hidden">
              <button
                type="button"
                className="hs-collapse-toggle size-9 flex justify-center items-center text-sm font-semibold rounded-lg border border-gray-200 text-gray-800 hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100"
                id="landing-nav-toggle"
                aria-expanded="false"
                aria-controls="landing-nav-menu"
                aria-label="Toggle navigation"
                data-hs-collapse="#landing-nav-menu"
              >
                <Menu className="size-4 shrink-0" />
              </button>
            </div>
          </div>

          <div
            id="landing-nav-menu"
            className="hs-collapse hidden overflow-hidden transition-all duration-300 basis-full grow md:block md:w-auto md:basis-auto md:order-2"
            aria-labelledby="landing-nav-toggle"
          >
            <div className="flex flex-col gap-y-4 gap-x-0 mt-5 md:flex-row md:items-center md:justify-end md:gap-y-0 md:gap-x-7 md:mt-0 md:ps-7">
              <a className="font-medium text-gray-500 hover:text-gray-800 focus:outline-hidden focus:text-gray-800" href="#features">
                Features
              </a>
              <a className="font-medium text-gray-500 hover:text-gray-800 focus:outline-hidden focus:text-gray-800" href="#how-it-works">
                How it works
              </a>
              <a className="font-medium text-gray-500 hover:text-gray-800 focus:outline-hidden focus:text-gray-800" href="#pricing">
                Pricing
              </a>
            </div>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero — Preline gradient hero pattern */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-b from-emerald-50 via-white to-white" />
          <div className="absolute top-0 start-1/2 -z-10 w-[1200px] h-[600px] -translate-x-1/2 bg-linear-to-b from-emerald-100/60 to-transparent rounded-full blur-3xl" />

          <div className="relative max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-x-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 mb-6">
                <Sparkles className="size-3.5" />
                Built for restaurants & cafes in Vietnam
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
                Your digital menu page,{' '}
                <span className="text-emerald-600">live in minutes</span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                Eatery helps you build a beautiful menu website, generate QR codes, accept payments,
                and connect your own domain — without hiring a developer.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/signup"
                  className="inline-flex justify-center items-center gap-x-2 py-3 px-6 text-sm font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800 focus:outline-hidden focus:bg-gray-800"
                >
                  Start building free
                </Link>
                <a
                  href="#features"
                  className="inline-flex justify-center items-center gap-x-2 py-3 px-6 text-sm font-semibold rounded-lg border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50"
                >
                  See features
                </a>
              </div>

              <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-gray-500">
                <span className="inline-flex items-center gap-2">
                  <span className="font-semibold text-gray-900">Free</span> to get started
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="font-semibold text-gray-900">No code</span> page builder
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="font-semibold text-gray-900">PayOS</span> ready
                </span>
              </div>
            </div>

            {/* Product preview mockup */}
            <div className="mt-16 lg:mt-20 max-w-5xl mx-auto">
              <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <span className="size-3 rounded-full bg-red-400" />
                  <span className="size-3 rounded-full bg-yellow-400" />
                  <span className="size-3 rounded-full bg-green-400" />
                  <span className="ms-3 text-xs text-gray-400">your-restaurant.eateryvn.com</span>
                </div>
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="p-8 md:p-10 bg-linear-to-br from-gray-900 to-gray-800 text-white">
                    <p className="text-sm text-gray-300">Tonight&apos;s specials</p>
                    <h2 className="mt-2 text-3xl font-bold">Saigon Street Kitchen</h2>
                    <p className="mt-3 text-gray-300 text-sm leading-relaxed">
                      Fresh pho, grilled seafood, and craft drinks — browse our menu and order from your table.
                    </p>
                    <div className="mt-6 inline-flex rounded-lg bg-white/10 px-4 py-2 text-sm">View menu</div>
                  </div>
                  <div className="p-8 md:p-10 bg-white">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Dashboard</p>
                    <h3 className="mt-2 text-xl font-bold text-gray-900">Build pages visually</h3>
                    <ul className="mt-6 space-y-3 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Hero, menu grid, gallery & contact blocks
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Live preview on mobile & desktop
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Publish with one click
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16 lg:py-24 bg-white">
          <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center mb-12 lg:mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                Everything you need to go digital
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                From your first menu page to custom domains and payments — Eatery grows with your business.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {features.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="group p-6 lg:p-8 rounded-2xl border border-gray-200 bg-white hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/50 transition-all duration-300"
                >
                  <div className="inline-flex justify-center items-center size-12 rounded-xl bg-emerald-50 text-emerald-600 mb-5">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                  <p className="mt-2 text-gray-600 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-16 lg:py-24 bg-gray-50">
          <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center mb-12 lg:mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Launch in three steps</h2>
              <p className="mt-4 text-lg text-gray-600">
                No agency. No WordPress. Just sign up and start building.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {steps.map(({ step, title, description }) => (
                <div key={step} className="relative text-center md:text-start">
                  <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-white border border-gray-200 text-lg font-bold text-emerald-600 shadow-sm mb-5">
                    {step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                  <p className="mt-3 text-gray-600 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-16 lg:py-24 bg-white">
          <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center mb-12 lg:mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Simple, transparent pricing</h2>
              <p className="mt-4 text-lg text-gray-600">
                Start free. Upgrade with credits when you need premium features like custom domains.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative flex flex-col p-6 lg:p-8 rounded-2xl border ${
                    plan.highlighted
                      ? 'border-emerald-200 bg-emerald-50/50 shadow-lg shadow-emerald-100/50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {plan.highlighted && (
                    <span className="absolute top-0 end-6 -translate-y-1/2 inline-flex items-center rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white">
                      Most flexible
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <p className="mt-2 text-4xl font-bold text-gray-900">{plan.price}</p>
                  <p className="mt-2 text-sm text-gray-600">{plan.note}</p>
                  <ul className="mt-6 space-y-3 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-x-3 text-sm text-gray-700">
                        <span className="mt-0.5 size-5 shrink-0 inline-flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs">
                          ✓
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={`mt-8 inline-flex justify-center items-center py-3 px-4 text-sm font-semibold rounded-lg focus:outline-hidden ${
                      plan.highlighted
                        ? 'bg-gray-900 text-white hover:bg-gray-800 focus:bg-gray-800'
                        : 'border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 focus:bg-gray-50'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-24 bg-gray-900">
          <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl lg:text-4xl font-bold text-white">
                Ready to launch your menu online?
              </h2>
              <p className="mt-4 text-lg text-gray-300">
                Join restaurants and cafes using Eatery to look professional online and serve guests faster.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/signup"
                  className="inline-flex justify-center items-center py-3 px-6 text-sm font-semibold rounded-lg bg-white text-gray-900 hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100"
                >
                  Create free account
                </Link>
                <Link
                  href="/login"
                  className="inline-flex justify-center items-center py-3 px-6 text-sm font-semibold rounded-lg border border-gray-700 text-white hover:bg-gray-800 focus:outline-hidden focus:bg-gray-800"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <Image src="/logo-full.png" alt="Eatery" width={120} height={36} className="h-8 w-auto" />
              <p className="mt-3 text-sm text-gray-500 max-w-sm">
                Digital pages for restaurants and cafes. Build menus, QR codes, and branded sites in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-500">
              <Link href="/signup" className="hover:text-gray-800">
                Sign up
              </Link>
              <Link href="/login" className="hover:text-gray-800">
                Sign in
              </Link>
              <a href="https://www.eateryvn.com" className="hover:text-gray-800">
                eateryvn.com
              </a>
            </div>
          </div>
          <p className="mt-8 text-xs text-gray-400">© {new Date().getFullYear()} Eatery. All rights reserved.</p>
        </div>
      </footer>
    </>
  )
}
