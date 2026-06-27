import Image from 'next/image'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { appPath } from '@/lib/site-urls'

const navLinks = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
]

export function MarketingNav({ active }: { active?: string }) {
  return (
    <header className="sticky top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <nav className="max-w-[85rem] flex flex-wrap md:flex-nowrap basis-full items-center justify-between mx-auto py-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex-none rounded-md focus:outline-hidden focus:opacity-80">
          <Image src="/logo-full.png" alt="Eatery" width={140} height={40} className="h-9 w-auto" priority />
        </Link>

        <div className="md:order-3 flex items-center gap-x-2">
          <a
            href={appPath('/login')}
            className="py-2 px-3 inline-flex items-center text-sm font-medium rounded-lg border border-transparent text-gray-800 hover:bg-gray-100"
          >
            Sign in
          </a>
          <a
            href={appPath('/signup')}
            className="py-2 px-3 inline-flex items-center text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800"
          >
            Get started
          </a>

          <div className="md:hidden">
            <button
              type="button"
              className="hs-collapse-toggle size-9 flex justify-center items-center text-sm font-semibold rounded-lg border border-gray-200 text-gray-800 hover:bg-gray-100"
              id="marketing-nav-toggle"
              aria-expanded="false"
              aria-controls="marketing-nav-menu"
              aria-label="Toggle navigation"
              data-hs-collapse="#marketing-nav-menu"
            >
              <Menu className="size-4 shrink-0" />
            </button>
          </div>
        </div>

        <div
          id="marketing-nav-menu"
          className="hs-collapse hidden overflow-hidden transition-all duration-300 basis-full grow md:block md:w-auto md:basis-auto md:order-2"
          aria-labelledby="marketing-nav-toggle"
        >
          <div className="flex flex-col gap-y-4 gap-x-0 mt-5 md:flex-row md:items-center md:justify-end md:gap-y-0 md:gap-x-7 md:mt-0 md:ps-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-medium focus:outline-hidden ${
                  active === link.href
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-800 focus:text-gray-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  )
}
