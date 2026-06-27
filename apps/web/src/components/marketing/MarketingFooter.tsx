import Image from 'next/image'
import Link from 'next/link'
import { appPath } from '@/lib/site-urls'

export function MarketingFooter() {
  return (
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
            <Link href="/features" className="hover:text-gray-800">
              Features
            </Link>
            <Link href="/pricing" className="hover:text-gray-800">
              Pricing
            </Link>
            <Link href="/blog" className="hover:text-gray-800">
              Blog
            </Link>
            <Link href="/contact" className="hover:text-gray-800">
              Contact
            </Link>
            <a href={appPath('/signup')} className="hover:text-gray-800">
              Sign up
            </a>
            <a href={appPath('/login')} className="hover:text-gray-800">
              Sign in
            </a>
          </div>
        </div>
        <p className="mt-8 text-xs text-gray-400">
          © {new Date().getFullYear()} Eatery. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
