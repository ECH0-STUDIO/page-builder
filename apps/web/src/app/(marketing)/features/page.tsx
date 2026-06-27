import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Globe,
  ImageIcon,
  LayoutTemplate,
  Menu,
  Printer,
  QrCode,
  Shield,
  Users,
  Wallet,
} from 'lucide-react'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { MarketingCta, PageHeader } from '@/components/marketing/MarketingCta'

export const metadata: Metadata = {
  title: 'Features',
  description:
    'Page builder, digital menus, QR codes, PayOS payments, custom domains, team access, and print menus for restaurants.',
}

const featureGroups = [
  {
    title: 'Build & publish',
    items: [
      {
        icon: LayoutTemplate,
        title: 'Visual page builder',
        description:
          'Drag-and-drop blocks: hero, text + image, menu grid, contact, QR, footer, and navbar. Live preview on desktop and mobile.',
      },
      {
        icon: Menu,
        title: 'Menu management',
        description:
          'Categories, dishes, prices, and photos synced to your public page. Update tonight’s specials in seconds.',
      },
      {
        icon: Printer,
        title: 'Print-ready menus',
        description: 'Export layouts for physical menus when you still want paper on the table.',
      },
    ],
  },
  {
    title: 'Grow & convert',
    items: [
      {
        icon: QrCode,
        title: 'QR code generator',
        description: 'Table QR codes that open your live menu — no app download for guests.',
      },
      {
        icon: Wallet,
        title: 'PayOS checkout',
        description: 'Payment drawer on your public page, localized for Vietnam.',
      },
      {
        icon: Globe,
        title: 'Custom domains',
        description: 'Self-service DNS instructions and verification. Your brand URL, not ours.',
      },
    ],
  },
  {
    title: 'Run your business',
    items: [
      {
        icon: Users,
        title: 'Team invites',
        description: 'Owner, manager, and staff roles so the right people can edit the right things.',
      },
      {
        icon: ImageIcon,
        title: 'Media gallery',
        description: 'Store dish and venue photos. Pay for extra storage only with credits when you need it.',
      },
      {
        icon: Shield,
        title: 'Secure by default',
        description: 'Auth, roles, and hosted infrastructure — so you focus on the menu, not servers.',
      },
    ],
  },
]

export default function FeaturesPage() {
  return (
    <MarketingShell activeNav="/features">
      <section className="py-16 lg:py-24">
        <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
          <PageHeader
            eyebrow="Product"
            title="Everything a modern restaurant needs online"
            description="One platform for your public menu page, dashboard, payments, and team — without stitching five tools together."
          />

          <div className="space-y-16 lg:space-y-20">
            {featureGroups.map((group) => (
              <div key={group.title}>
                <h2 className="text-2xl font-bold text-gray-900 mb-8">{group.title}</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {group.items.map(({ icon: Icon, title, description }) => (
                    <div key={title} className="p-6 rounded-2xl border border-gray-200 bg-white">
                      <div className="size-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                        <Icon className="size-5" />
                      </div>
                      <h3 className="font-semibold text-gray-900">{title}</h3>
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link
              href="/pricing"
              className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              See credit-based pricing →
            </Link>
          </div>
        </div>
      </section>
      <MarketingCta />
    </MarketingShell>
  )
}
