'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { SupportedLocale } from '@/i18n/locale'
import { MarketingLocaleSwitcher } from '@/components/marketing/MarketingLocaleSwitcher'
import { getMarketingCopy } from '@/lib/marketing-copy'
import { marketingPathForLocale } from '@/lib/marketing-locale'
import { appPath } from '@/lib/site-urls'

export function NexbetNav({ locale }: { locale: SupportedLocale }) {
  const [open, setOpen] = useState(false)
  const copy = getMarketingCopy(locale)

  const links = [
    { href: '/#impacts', label: copy.nav.whyEatery },
    { href: marketingPathForLocale('/features', locale), label: copy.nav.features },
    { href: marketingPathForLocale('/pricing', locale), label: copy.nav.pricing },
    { href: marketingPathForLocale('/blog', locale), label: copy.nav.blog },
    { href: marketingPathForLocale('/contact', locale), label: copy.nav.contact },
  ]

  return (
    <div
      data-animation="default"
      className={`navbar w-nav${open ? ' w--open' : ''}`}
      data-collapse="medium"
      role="banner"
    >
      <div className="padding-global is-navbar">
        <div className="container-large">
          <div className="navbar_content">
            <Link
              href={marketingPathForLocale('/', locale)}
              className="navbar_logo-link w-nav-brand"
              onClick={() => setOpen(false)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-full.png" alt="Eatery" className="navbar_logo-eatery" />
            </Link>
            <div className="nav_wrap">
              <nav role="navigation" className={`nav_mobile w-nav-menu${open ? ' w--nav-menu-open' : ''}`}>
                <div className="navbar_list">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="nav_links w-nav-link"
                      onClick={() => setOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </nav>
            </div>
            <div className="nav_buttons-wrap">
              <MarketingLocaleSwitcher locale={locale} />
              <div className="login-wrap hide-mobile-landscape" style={{ display: 'flex', gap: '0.5rem' }}>
                <a href={appPath('/login')} className="nav_links w-nav-link" style={{ padding: '0.5rem 1rem' }}>
                  {copy.nav.signIn}
                </a>
                <a
                  href={appPath('/signup')}
                  className="button w-variant-f1e95c86-d79c-1afb-2e10-8488560bd746 w-inline-block"
                >
                  <div className="button_mask">
                    <div className="button_text">{copy.nav.getStarted}</div>
                    <div className="button_text is-hide">{copy.nav.getStarted}</div>
                  </div>
                </a>
              </div>
              <button
                type="button"
                className="menu-button w-nav-button"
                aria-label="menu"
                onClick={() => setOpen((v) => !v)}
              >
                <div className="nav-button_component">
                  <div className="nav-button_line is-first" />
                  <div className="nav-button_line is-second" />
                  <div className="nav-button_line is-third" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
